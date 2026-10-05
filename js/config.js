/* =====================================================================
   WEBSITE CONFIGURATION  —  js/config.js
   =====================================================================
   THIS IS THE ONLY FILE YOU NEED TO EDIT TO CHANGE THE WEBSITE.

   - Change the text between the quotation marks "like this".
   - Do NOT delete the commas at the end of lines.
   - Do NOT delete the quotation marks.
   - Anything that still says YOUR_SOMETHING is a placeholder for you to replace.
   - Everything in this file is PUBLIC (anyone can read it in their browser).
     NEVER put passwords, API keys or your administrator email in this file.

   The matching SERVER settings (admin email, Google Sheet ID, meeting link,
   email content) live in the Google Apps Script file (Code.gs).
   ===================================================================== */

window.SITE_CONFIG = {

  /* ===================================================================
     1. ORGANISATION & LOGO
     =================================================================== */

  // Your organisation name (shown in the header, footer and page title).
  ORGANISATION_NAME: "MacTusinIT",

  // A short line describing what you do (shown under the logo area / footer).
  TAGLINE: "Cybersecurity Bootcamp",

  // Your logo file. Upload your logo into the "assets" folder and put its
  // file name here. Examples: "assets/logo.png"  or  "assets/logo.svg"
  // (It must be a file inside this website's "assets" folder. For security,
  //  logos hosted on other websites are blocked by the browser.)
  LOGO: "assets/logo.svg",


  /* ===================================================================
     2. BACKEND CONNECTION  (Google Apps Script Web App)
     =================================================================== */

  // Paste the Web App URL you get after deploying Code.gs, e.g.
  // "https://script.google.com/macros/s/AKfycb.../exec"
  // While this still says YOUR_APPS_SCRIPT_URL the site runs in PREVIEW MODE
  // (the form works, but nothing is saved or emailed).
  APPS_SCRIPT_URL: "https://script.google.com/macros/s/AKfycbyYTnzQRUyCha0DOCOaeLbDQ48hKhCRYi8RaICFMKkt3hzNzigZ0tbUWKpiqB8d5JR-_w/exec",

  // How long (in milliseconds) to wait for the server before showing an error.
  REQUEST_TIMEOUT_MS: 45000,


  /* ===================================================================
     3. OPEN / CLOSE REGISTRATION
     =================================================================== */

  // true  = people can register.
  // false = the form is hidden and the message below is shown instead.
  // (Also set REGISTRATION_OPEN in Code.gs so the server agrees.)
  REGISTRATION_OPEN: true,
  REGISTRATION_CLOSED_MESSAGE:
    "Registration for this training is currently closed. Please contact us if you would like to be notified about the next intake.",


  /* ===================================================================
     4. COURSE / TRAINING DETAILS
     ===================================================================
     Add one block { ... } per course. If you only run ONE course, keep
     just one block. If you list several, applicants choose from a menu.

     IMPORTANT: the course "name" must be written EXACTLY the same here and
     in Code.gs.
     Leave a value as "" (empty) to hide it from the page.
     (The Zoom / Google Meet link is NOT shown on the website. It is set in
     Code.gs and sent privately in the confirmation email.)
     =================================================================== */
  COURSES: [
    {
      name: "Cybersecurity",
      description: "MacTusinIT 16-Week CYbersecirity Bootcamp.",
      price: "#25,000 per month",
      startDate: "08-10-26",
      duration: "4 Months",
      venue: "Online via Zoom / Google Meet)"
    }

    /* To add a second course, put a comma after the block above and
       copy this block:
    ,{
      name: "YOUR_SECOND_COURSE_NAME",
      description: "Short description.",
      price: "YOUR_COURSE_PRICE",
      startDate: "YOUR_COURSE_START_DATE",
      duration: "YOUR_COURSE_DURATION",
      venue: "YOUR_TRAINING_VENUE"
    }
    */
  ],

  // Optional: pre-select a country in the form (e.g. "Nigeria"). "" = none.
  DEFAULT_COUNTRY: "Nigeria",


  /* ===================================================================
     5. CONTACT INFORMATION  (shown to applicants — public information only)
     =================================================================== */
  CONTACT: {
    PHONE: "+2348115917786",
    EMAIL: "mactusinitbootcamps@gmail.com",       // public support email
    // WhatsApp number: digits only, with country code, NO plus sign or spaces.
    WHATSAPP: "2348115917786"
  },


  /* ===================================================================
     6. WEBSITE & SOCIAL MEDIA LINKS
     ===================================================================
     Paste full links (starting with https://). Leave "" to hide an icon. */
  LINKS: {
    // "Return to Homepage" button on the success page goes here.
    // Leave as "" to return to the registration page instead.
    HOMEPAGE: "YOUR_WEBSITE_URL",
    FACEBOOK: "",
    INSTAGRAM: "",
    LINKEDIN: "",
    X_TWITTER: "",
    YOUTUBE: ""
  },


  /* ===================================================================
     7. PAYMENT SECTION  (easy to switch on later)
     ===================================================================
     For now payment is handled AFTER registration.
       ENABLED: false  -> shows the "Payment instructions will be provided
                          after registration" message.
       ENABLED: true   -> shows the DETAILS lines and the optional pay link
                          on the review step and on the success page.
     (Also update PAYMENT in Code.gs so the email says the same thing.) */
  PAYMENT: {
    ENABLED: false,
    PENDING_MESSAGE: "Payment instructions will be provided after registration.",
    TITLE: "Payment Information",
    DETAILS: [
      "Bank: YOUR_BANK_NAME",
      "Account Name: YOUR_ACCOUNT_NAME",
      "Account Number: YOUR_ACCOUNT_NUMBER"
    ],
    NOTE: "Please use your Registration ID as the payment reference.",
    LINK: "",                 // optional online payment link, e.g. a Paystack / Flutterwave / PayPal page
    LINK_LABEL: "Pay Online"
  },


  /* ===================================================================
     8. FORM DROP-DOWN OPTIONS  (edit freely)
     =================================================================== */
  EDUCATION_OPTIONS: [
    "Secondary / High School",
    "Diploma / Certificate",
    "Bachelor's Degree",
    "Master's Degree",
    "Doctorate (PhD)",
    "Professional Certification",
    "Self-taught / Other"
  ],

  REFERRAL_OPTIONS: [
    "Facebook",
    "Instagram",
    "LinkedIn",
    "X (Twitter)",
    "WhatsApp",
    "YouTube",
    "Google Search",
    "Friend / Colleague",
    "Email",
    "Event / Seminar",
    "Other"
  ],


  /* ===================================================================
     9. SUCCESS PAGE
     =================================================================== */

  // The "What happens next" list on the success page.
  NEXT_STEPS: [
    "Check your email inbox (and your spam / junk folder) for your confirmation message.",
    "Keep your Registration ID safe. You will need it when you contact us.",
    "Our team will contact you with payment instructions and joining details."
  ],

  // Optional: a WhatsApp group invite link (https://chat.whatsapp.com/...).
  // When filled in, a "Join the WhatsApp group" button appears on the success page.
  WHATSAPP_GROUP_LINK: "",


  /* ===================================================================
     10. MESSAGES
     =================================================================== */
  GENERIC_ERROR_MESSAGE:
    "We could not complete your registration at this time. Please check your internet connection and try again."
};
