/**
 * EZFOODZ Payment Processing System
 * Integrates multiple payment methods for checkout
 */

// Main payment handler
const PaymentHandler = {
    // Initialize payment forms
    init: function() {
        // Set up event listeners
        this.setupEventListeners();
        
        // Initialize payment forms
        this.initCreditCardForm();
        this.initUPIForm();
        this.initWalletForm();
    },
    
    // Set up event listeners
    setupEventListeners: function() {
        // Payment method selection
        const paymentMethods = document.querySelectorAll('.payment-method');
        if (paymentMethods) {
            paymentMethods.forEach(method => {
                method.addEventListener('click', function() {
                    // Remove active class from all methods
                    paymentMethods.forEach(m => m.classList.remove('active'));
                    
                    // Add active class to selected method
                    this.classList.add('active');
                    
                    // Show corresponding form
                    const formId = this.getAttribute('data-form');
                    document.querySelectorAll('.payment-form').forEach(form => {
                        form.classList.add('d-none');
                    });
                    
                    document.getElementById(formId).classList.remove('d-none');
                    
                    // Update hidden input
                    document.getElementById('payment_method').value = this.getAttribute('data-method');
                });
            });
        }
        
        // Initialize payment button
        const paymentButton = document.getElementById('pay-button');
        if (paymentButton) {
            paymentButton.addEventListener('click', this.processPayment.bind(this));
        }
    },
    
    // Initialize credit card form with validation
    initCreditCardForm: function() {
        const ccForm = document.getElementById('card-form');
        if (!ccForm) return;
        
        // Card number formatting
        const cardNumber = document.getElementById('card_number');
        if (cardNumber) {
            cardNumber.addEventListener('input', function(e) {
                // Remove non-digit characters
                let value = e.target.value.replace(/\D/g, '');
                
                // Add spaces after every 4 digits
                value = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                
                // Limit to 19 characters (16 digits + 3 spaces)
                value = value.substring(0, 19);
                
                e.target.value = value;
            });
        }
        
        // Expiry date formatting
        const expiryDate = document.getElementById('expiry_date');
        if (expiryDate) {
            expiryDate.addEventListener('input', function(e) {
                // Remove non-digit characters
                let value = e.target.value.replace(/\D/g, '');
                
                // Add slash after 2 digits
                if (value.length > 2) {
                    value = value.substring(0, 2) + '/' + value.substring(2);
                }
                
                // Limit to 5 characters (MM/YY)
                value = value.substring(0, 5);
                
                e.target.value = value;
            });
        }
        
        // CVV validation
        const cvv = document.getElementById('cvv');
        if (cvv) {
            cvv.addEventListener('input', function(e) {
                // Remove non-digit characters
                let value = e.target.value.replace(/\D/g, '');
                
                // Limit to 3 digits
                value = value.substring(0, 3);
                
                e.target.value = value;
            });
        }
    },
    
    // Initialize UPI form
    initUPIForm: function() {
        const upiForm = document.getElementById('upi-form');
        if (!upiForm) return;
        
        // UPI ID validation
        const upiId = document.getElementById('upi_id');
        if (upiId) {
            upiId.addEventListener('input', function(e) {
                // Convert to lowercase
                e.target.value = e.target.value.toLowerCase();
            });
        }
    },
    
    // Initialize wallet form
    initWalletForm: function() {
        const walletForm = document.getElementById('wallet-form');
        if (!walletForm) return;
        
        // Wallet selection
        const walletOptions = document.querySelectorAll('.wallet-option');
        if (walletOptions) {
            walletOptions.forEach(option => {
                option.addEventListener('click', function() {
                    // Remove active class from all options
                    walletOptions.forEach(o => o.classList.remove('selected'));
                    
                    // Add active class to selected option
                    this.classList.add('selected');
                    
                    // Update hidden input
                    document.getElementById('wallet_type').value = this.getAttribute('data-wallet');
                });
            });
        }
    },
    
    // Process payment
    processPayment: function(e) {
        e.preventDefault();
        
        // Show loading
        this.showLoading();
        
        // Get selected payment method
        const paymentMethod = document.getElementById('payment_method').value;
        
        // Validate payment data
        if (!this.validatePaymentData(paymentMethod)) {
            this.hideLoading();
            return;
        }
        
        // Simulate payment processing
        setTimeout(() => {
            // In a real application, this would be an API call to a payment processor
            
            // For demo purposes, generate a random success or failure
            const success = Math.random() > 0.2; // 80% success rate
            
            if (success) {
                this.onPaymentSuccess();
            } else {
                this.onPaymentError('Transaction declined by bank. Please try another payment method.');
            }
        }, 2000);
    },
    
    // Validate payment data
    validatePaymentData: function(method) {
        let isValid = true;
        const errorContainer = document.getElementById('payment-errors');
        errorContainer.innerHTML = '';
        
        if (method === 'card') {
            // Validate card details
            const cardNumber = document.getElementById('card_number').value.replace(/\s/g, '');
            const cardName = document.getElementById('card_name').value;
            const expiryDate = document.getElementById('expiry_date').value;
            const cvv = document.getElementById('cvv').value;
            
            if (cardNumber.length !== 16) {
                this.showError('Please enter a valid 16-digit card number');
                isValid = false;
            }
            
            if (!cardName.trim()) {
                this.showError('Please enter the name on card');
                isValid = false;
            }
            
            if (expiryDate.length !== 5 || !expiryDate.includes('/')) {
                this.showError('Please enter a valid expiry date (MM/YY)');
                isValid = false;
            }
            
            if (cvv.length !== 3) {
                this.showError('Please enter a valid 3-digit CVV');
                isValid = false;
            }
        } else if (method === 'upi') {
            // Validate UPI ID
            const upiId = document.getElementById('upi_id').value;
            
            if (!upiId.includes('@') || upiId.split('@').length !== 2) {
                this.showError('Please enter a valid UPI ID (example: user@bank)');
                isValid = false;
            }
        } else if (method === 'wallet') {
            // Validate wallet selection
            const walletType = document.getElementById('wallet_type').value;
            
            if (!walletType) {
                this.showError('Please select a wallet');
                isValid = false;
            }
        } else if (method === 'cod') {
            // No validation needed for COD
        }
        
        return isValid;
    },
    
    // Show error message
    showError: function(message) {
        const errorContainer = document.getElementById('payment-errors');
        const errorElement = document.createElement('div');
        errorElement.className = 'alert alert-danger mb-3';
        errorElement.textContent = message;
        errorContainer.appendChild(errorElement);
    },
    
    // Show loading overlay
    showLoading: function() {
        document.getElementById('payment-loading').classList.remove('d-none');
        document.getElementById('pay-button').disabled = true;
    },
    
    // Hide loading overlay
    hideLoading: function() {
        document.getElementById('payment-loading').classList.add('d-none');
        document.getElementById('pay-button').disabled = false;
    },
    
    // Handle successful payment
    onPaymentSuccess: function() {
        // Hide loading
        this.hideLoading();
        
        // Show success message
        document.getElementById('payment-success').classList.remove('d-none');
        document.getElementById('payment-container').classList.add('d-none');
        
        // Submit the form to complete the order
        setTimeout(() => {
            document.getElementById('checkout-form').submit();
        }, 1500);
    },
    
    // Handle payment error
    onPaymentError: function(message) {
        // Hide loading
        this.hideLoading();
        
        // Show error message
        this.showError(message);
    }
};

// Initialize payment handler when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    PaymentHandler.init();
});