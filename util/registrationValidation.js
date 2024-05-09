function validateForm() {

    const firstName = document.getElementsByName("fname")[0];
    const lastName = document.getElementsByName("sname")[0];
    const username = document.getElementsByName("username")[0];
    const email = document.getElementsByName("email")[0];
    const mobileNumber = document.getElementsByName("number")[0];
    const password = document.getElementsByName("password")[0];
    const confirmPassword = document.getElementsByName("confirm-password")[0];
  
    
    const errorMessages = document.getElementById("error-messages");
    if (errorMessages) {
      errorMessages.innerHTML = "";
    }
  
    
    let isValid = true;
    const errorMessageList = [];
  
    // Validate Name (both first and last)
    const nameValidationRegex = /^[a-zA-Z]+$/;  // Only letters allowed
    if (!firstName.value.trim() || !lastName.value.trim()) {
      errorMessageList.push("First and Last Name cannot be empty.");
    } else if (!firstName.value.match(nameValidationRegex) || !lastName.value.match(nameValidationRegex)) {
      errorMessageList.push("Name should only contain letters and no spaces.");
    }
  
    // Validate Mobile Number
    const mobileValidationRegex = /^\d{10}$/;  // Exactly 10 digits
    if (!mobileNumber.value.match(mobileValidationRegex) || mobileNumber.value === "0000000000") {
      errorMessageList.push("Mobile number must be 10 digits and cannot be all zeros.");
    }
  
    // Validate Email 
    const emailValidationRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.value.trim() || !email.value.match(emailValidationRegex)) {
      errorMessageList.push("Please enter a valid email address.");
    }
  
    // Validate password 
    const passwordMinLength = 8;  // Minimum password length
    if (password.value.length < passwordMinLength) {
      errorMessageList.push(`Password must be at least ${passwordMinLength} characters long.`);
    }
  
    // Validate confirm password (match with password)
    if (confirmPassword.value !== password.value) {
      errorMessageList.push("Passwords do not match.");
    }
  
    
    if (errorMessageList.length > 0) {
      isValid = false;
      let errorMessage = "<b>Please fix the following errors:</b><br>";
      errorMessage += errorMessageList.join("<br>");
      if (errorMessages) {
        errorMessages.innerHTML = errorMessage;
      } else {
        alert(errorMessage);
      }
    }
  
    return isValid;
  }
  

 document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById("Regform");
    if (form) {
        form.addEventListener("submit", function(event) {
            if (!validateForm()) {
                event.preventDefault();  
            }
        });
    }
});