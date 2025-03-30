/**
 * EZFOODZ Delivery Tracking System
 * Connects delivery partners with customers via live location tracking
 */

// Initialize delivery tracking system
function initDeliveryTracking(orderId, isDeliveryPartner = false) {
    // Store DOM elements
    const mapElement = document.getElementById('delivery-map');
    const statusElement = document.getElementById('tracking-status');
    let map, marker, customerMarker, deliveryRoute;
    let watchId = null;
    let currentPosition = null;
    let customerPosition = null;

    // Initialize tracking map
    function initMap() {
        // Default map center (Will be updated with real location)
        const defaultCenter = { lat: 13.0827, lng: 80.2707 }; // Chennai coordinates as fallback
        
        // Create map instance
        map = new google.maps.Map(mapElement, {
            zoom: 15,
            center: defaultCenter,
            styles: [
                // Dark theme map styles
                {elementType: "geometry", stylers: [{color: "#242f3e"}]},
                {elementType: "labels.text.stroke", stylers: [{color: "#242f3e"}]},
                {elementType: "labels.text.fill", stylers: [{color: "#746855"}]},
                {
                    featureType: "administrative.locality",
                    elementType: "labels.text.fill",
                    stylers: [{color: "#d59563"}]
                },
                {
                    featureType: "poi",
                    elementType: "labels.text.fill",
                    stylers: [{color: "#d59563"}]
                },
                {
                    featureType: "poi.park",
                    elementType: "geometry",
                    stylers: [{color: "#263c3f"}]
                },
                {
                    featureType: "poi.park",
                    elementType: "labels.text.fill",
                    stylers: [{color: "#6b9a76"}]
                },
                {
                    featureType: "road",
                    elementType: "geometry",
                    stylers: [{color: "#38414e"}]
                },
                {
                    featureType: "road",
                    elementType: "geometry.stroke",
                    stylers: [{color: "#212a37"}]
                },
                {
                    featureType: "road",
                    elementType: "labels.text.fill",
                    stylers: [{color: "#9ca5b3"}]
                },
                {
                    featureType: "road.highway",
                    elementType: "geometry",
                    stylers: [{color: "#746855"}]
                },
                {
                    featureType: "road.highway",
                    elementType: "geometry.stroke",
                    stylers: [{color: "#1f2835"}]
                },
                {
                    featureType: "road.highway",
                    elementType: "labels.text.fill",
                    stylers: [{color: "#f3d19c"}]
                },
                {
                    featureType: "transit",
                    elementType: "geometry",
                    stylers: [{color: "#2f3948"}]
                },
                {
                    featureType: "transit.station",
                    elementType: "labels.text.fill",
                    stylers: [{color: "#d59563"}]
                },
                {
                    featureType: "water",
                    elementType: "geometry",
                    stylers: [{color: "#17263c"}]
                },
                {
                    featureType: "water",
                    elementType: "labels.text.fill",
                    stylers: [{color: "#515c6d"}]
                },
                {
                    featureType: "water",
                    elementType: "labels.text.stroke",
                    stylers: [{color: "#17263c"}]
                }
            ]
        });

        // Create delivery person marker
        marker = new google.maps.Marker({
            map: map,
            icon: {
                url: '/static/img/delivery-icon.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            title: 'Delivery Partner'
        });

        // Create customer marker
        customerMarker = new google.maps.Marker({
            map: map,
            icon: {
                url: '/static/img/customer-icon.png',
                scaledSize: new google.maps.Size(40, 40)
            },
            title: 'Delivery Location'
        });

        // Create route polyline
        deliveryRoute = new google.maps.Polyline({
            map: map,
            path: [],
            strokeColor: '#FF5E00',
            strokeOpacity: 0.7,
            strokeWeight: 4
        });
    }

    // Start tracking location
    function startTracking() {
        if (navigator.geolocation) {
            // Get customer location first (from order data)
            fetchCustomerLocation(orderId).then(position => {
                customerPosition = position;
                customerMarker.setPosition(position);
                
                // If we're the delivery partner, start sending our location
                if (isDeliveryPartner) {
                    watchId = navigator.geolocation.watchPosition(
                        onPositionUpdate,
                        onPositionError,
                        { enableHighAccuracy: true, maximumAge: 10000, timeout: 10000 }
                    );
                    
                    statusElement.innerHTML = '<span class="badge bg-success"><i class="fas fa-broadcast-tower me-1"></i> Live Tracking Active</span>';
                } else {
                    // We're the customer, just watching for updates
                    startReceivingUpdates();
                    statusElement.innerHTML = '<span class="badge bg-info"><i class="fas fa-satellite-dish me-1"></i> Waiting for delivery updates...</span>';
                }
            }).catch(error => {
                console.error('Error fetching customer location:', error);
                statusElement.innerHTML = '<span class="badge bg-danger"><i class="fas fa-exclamation-triangle me-1"></i> Location error</span>';
            });
        } else {
            statusElement.innerHTML = '<span class="badge bg-danger"><i class="fas fa-exclamation-triangle me-1"></i> Geolocation not supported</span>';
        }
    }

    // Update position handler
    function onPositionUpdate(position) {
        currentPosition = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
        };
        
        // Update marker position
        marker.setPosition(currentPosition);
        
        // Center map if first position
        if (!map.get('initialized')) {
            map.setCenter(currentPosition);
            map.set('initialized', true);
        }
        
        // Update route
        const path = deliveryRoute.getPath();
        path.push(new google.maps.LatLng(currentPosition.lat, currentPosition.lng));
        
        // Calculate and display ETA
        if (customerPosition) {
            calculateETA(currentPosition, customerPosition);
        }
        
        // Send position update to server
        if (isDeliveryPartner) {
            sendPositionUpdate(orderId, currentPosition);
        }
    }

    // Position error handler
    function onPositionError(error) {
        console.error('Error getting location:', error.message);
        statusElement.innerHTML = `<span class="badge bg-danger"><i class="fas fa-exclamation-triangle me-1"></i> ${error.message}</span>`;
    }

    // Calculate ETA between points
    function calculateETA(origin, destination) {
        const service = new google.maps.DistanceMatrixService();
        service.getDistanceMatrix({
            origins: [origin],
            destinations: [destination],
            travelMode: google.maps.TravelMode.DRIVING,
            unitSystem: google.maps.UnitSystem.METRIC
        }, (response, status) => {
            if (status === 'OK' && response.rows[0].elements[0].status === 'OK') {
                const distance = response.rows[0].elements[0].distance.text;
                const duration = response.rows[0].elements[0].duration.text;
                
                document.getElementById('distance-info').textContent = distance;
                document.getElementById('eta-info').textContent = duration;
            }
        });
    }

    // Fetch customer location from order
    async function fetchCustomerLocation(orderId) {
        const response = await fetch(`/api/order/${orderId}/location`);
        if (!response.ok) {
            throw new Error('Failed to fetch customer location');
        }
        const data = await response.json();
        return { lat: data.latitude, lng: data.longitude };
    }

    // Send position update to server
    function sendPositionUpdate(orderId, position) {
        fetch('/api/delivery/update_location', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_id: orderId,
                latitude: position.lat,
                longitude: position.lng
            })
        });
    }

    // For customers: periodically check for delivery partner location updates
    function startReceivingUpdates() {
        setInterval(async () => {
            try {
                const response = await fetch(`/api/order/${orderId}/delivery_location`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.latitude && data.longitude) {
                        const position = { 
                            lat: data.latitude, 
                            lng: data.longitude 
                        };
                        
                        // Update delivery partner marker
                        marker.setPosition(position);
                        
                        // Update route
                        const path = deliveryRoute.getPath();
                        path.push(new google.maps.LatLng(position.lat, position.lng));
                        
                        // Calculate ETA
                        calculateETA(position, customerPosition);
                        
                        // Update status
                        statusElement.innerHTML = `<span class="badge bg-success"><i class="fas fa-motorcycle me-1"></i> Delivery partner is on the way</span>`;
                    }
                }
            } catch (error) {
                console.error('Error fetching delivery location:', error);
            }
        }, 10000); // Check every 10 seconds
    }

    // Stop tracking
    function stopTracking() {
        if (watchId !== null) {
            navigator.geolocation.clearWatch(watchId);
            watchId = null;
        }
    }

    // Initialize map when loaded
    initMap();
    startTracking();

    // Return public API
    return {
        stopTracking: stopTracking
    };
}