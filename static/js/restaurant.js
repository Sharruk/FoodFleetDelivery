/**
 * Restaurant Dashboard JavaScript
 * Handles restaurant dashboard functionality
 */

document.addEventListener('DOMContentLoaded', function() {
    // Restaurant status toggle
    const statusToggle = document.getElementById('restaurant-status-toggle');
    const statusBadge = document.getElementById('restaurant-status-badge');
    
    if (statusToggle) {
        statusToggle.addEventListener('change', function() {
            // Show loading state
            const originalText = statusBadge.textContent;
            statusBadge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
            fetch('/api/toggle_restaurant_status', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({}),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update badge
                    statusBadge.textContent = data.is_open ? 'OPEN' : 'CLOSED';
                    statusBadge.className = `badge ${data.is_open ? 'bg-success' : 'bg-danger'}`;
                    
                    // Show toast notification
                    if (window.showToast) {
                        window.showToast(data.message, data.is_open ? 'success' : 'warning');
                    } else {
                        alert(data.message);
                    }
                } else {
                    // Revert toggle if operation failed
                    statusToggle.checked = !statusToggle.checked;
                    statusBadge.textContent = originalText;
                    
                    alert(data.message || 'Error updating restaurant status');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Revert toggle if operation failed
                statusToggle.checked = !statusToggle.checked;
                statusBadge.textContent = originalText;
                
                alert('An error occurred. Please try again.');
            });
        });
    }
    
    // Menu item availability toggle
    const availabilityToggles = document.querySelectorAll('.toggle-availability');
    
    availabilityToggles.forEach(toggle => {
        toggle.addEventListener('change', function() {
            const menuItemId = this.getAttribute('data-menu-item-id');
            const menuItemCard = document.querySelector(`.menu-item-card[data-menu-item-id="${menuItemId}"]`);
            const availabilityBadge = menuItemCard.querySelector('.availability-badge');
            
            // Show loading state
            const originalText = availabilityBadge.textContent;
            availabilityBadge.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
            
            fetch('/api/toggle_menu_item', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    item_id: menuItemId
                }),
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    // Update menu item card
                    availabilityBadge.textContent = data.is_available ? 'In Stock' : 'Out of Stock';
                    availabilityBadge.className = `badge availability-badge ${data.is_available ? 'bg-success' : 'bg-danger'}`;
                    
                    if (data.is_available) {
                        menuItemCard.classList.remove('out-of-stock');
                    } else {
                        menuItemCard.classList.add('out-of-stock');
                    }
                    
                    // Show toast notification
                    if (window.showToast) {
                        window.showToast(data.message, data.is_available ? 'success' : 'warning');
                    }
                } else {
                    // Revert toggle if operation failed
                    this.checked = !this.checked;
                    availabilityBadge.textContent = originalText;
                    
                    alert(data.message || 'Error updating menu item availability');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Revert toggle if operation failed
                this.checked = !this.checked;
                availabilityBadge.textContent = originalText;
                
                alert('An error occurred. Please try again.');
            });
        });
    });
    
    // Update order status buttons
    const orderStatusBtns = document.querySelectorAll('.update-order-status');
    orderStatusBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const orderId = this.getAttribute('data-order-id');
            const status = this.getAttribute('data-status');
            
            // Disable button to prevent double-clicks
            this.disabled = true;
            const originalHtml = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
            
            updateOrderStatus(orderId, status, this, originalHtml);
        });
    });
    
    // Function to update order status
    function updateOrderStatus(orderId, status, button, originalHtml) {
        if (status === 'cancelled' && !confirm('Are you sure you want to cancel this order?')) {
            // Re-enable button
            button.disabled = false;
            button.innerHTML = originalHtml;
            return;
        }
        
        fetch('/api/order/update_status', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                order_id: orderId,
                status: status
            }),
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Display success message
                if (window.showToast) {
                    window.showToast(data.message, 'success');
                } else {
                    alert(data.message);
                }
                
                // Refresh the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                // Re-enable button
                button.disabled = false;
                button.innerHTML = originalHtml;
                
                // Display error message
                alert(data.message || 'Error updating order status.');
            }
        })
        .catch(error => {
            console.error('Error:', error);
            
            // Re-enable button
            button.disabled = false;
            button.innerHTML = originalHtml;
            
            alert('An error occurred. Please try again.');
        });
    }
    
    // Menu item search functionality
    const menuSearch = document.getElementById('menu-search');
    const menuItems = document.querySelectorAll('.menu-item-card');
    const noResultsDiv = document.getElementById('no-menu-results');
    
    if (menuSearch) {
        menuSearch.addEventListener('input', function() {
            const searchQuery = this.value.toLowerCase();
            let visibleCount = 0;
            
            menuItems.forEach(item => {
                const name = item.querySelector('h6').textContent.toLowerCase();
                const description = item.querySelector('p.card-text') ? 
                                   item.querySelector('p.card-text').textContent.toLowerCase() : '';
                const category = item.getAttribute('data-category') ? 
                                item.getAttribute('data-category').toLowerCase() : '';
                
                if (name.includes(searchQuery) || description.includes(searchQuery) || category.includes(searchQuery)) {
                    item.style.display = '';
                    visibleCount++;
                } else {
                    item.style.display = 'none';
                }
            });
            
            // Show/hide no results message
            if (noResultsDiv) {
                noResultsDiv.style.display = visibleCount === 0 ? 'block' : 'none';
            }
        });
    }
});
