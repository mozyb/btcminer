# Requirements Document

## 1. Application Overview

### 1.1 Application Name
BTCMiner.online

### 1.2 Application Description
An enterprise-grade cloud mining and hashrate marketplace platform with integrated Enterprise Email System & Notification Center. This is a legitimate cloud mining infrastructure platform focused on hashrate trading, mining contract management, mining farm operations, and comprehensive email communication management.

## 2. Users and Usage Scenarios

### 2.1 Target Users
- Individual miners seeking to purchase hashrate
- Mining enthusiasts wanting to participate in cloud mining
- Users interested in cryptocurrency mining without hardware ownership
- Affiliates promoting the platform
- Platform administrators managing operations and email communications
- Support staff managing customer communications

### 2.2 Core Usage Scenarios
- Users purchase hashrate contracts from the marketplace
- Users monitor their mining performance and rewards
- Users manage deposits and withdrawals
- Users receive automated email notifications for account activities
- Administrators manage mining farms, hardware, and contracts
- Administrators configure email providers and manage email delivery
- Administrators create and send newsletters to user segments
- Administrators monitor email delivery performance and analytics
- Public visitors explore mining options and transparency data

## 3. Page Structure and Functional Description

### 3.1 Page Structure

```
BTCMiner.online Platform
├── Public Website
│   ├── Homepage
│   ├── About Us
│   ├── Mining Marketplace
│   ├── Individual Contract SEO Pages
│   ├── Global Mining Infrastructure
│   ├── Mining Hardware
│   ├── Mining Calculator
│   ├── Individual Calculator Landing Variations
│   ├── Pricing
│   ├── Affiliate Program
│   ├── Blog
│   ├── News
│   ├── FAQ
│   ├── Contact
│   ├── Transparency Center
│   ├── Security
│   ├── Proof of Mining
│   ├── Terms of Service
│   ├── Privacy Policy
│   ├── AML Policy
│   ├── KYC Policy
│   └── Risk Disclosure
├── Authentication Pages
│   ├── Registration
│   ├── Login
│   ├── Email Verification
│   ├── Forgot Password
│   └── Reset Password
├── User Dashboard
│   ├── Dashboard Overview
│   ├── My Mining Contracts
│   ├── Hashrate Marketplace
│   ├── Mining Analytics
│   ├── Wallet Management
│   ├── Deposit
│   ├── Withdrawal
│   ├── Transaction History
│   ├── Affiliate Dashboard
│   ├── KYC Verification
│   ├── Support Center
│   ├── Notifications
│   ├── Account Settings
│   └── Security Settings
└── Admin Dashboard
    ├── Admin Overview
    ├── User Management
    ├── Contract Management
    ├── Mining Farm Management
    ├── Hardware Management
    ├── Wallet Management
    ├── Deposit Management
    ├── Withdrawal Management
    ├── API Management
    ├── Affiliate Management
    ├── KYC Management
    ├── Support Ticket Management
    ├── CMS Management
    ├── SEO Management
    ├── Marketplace Content Management
    ├── Calculator Content Management
    ├── Pricing Page Content Management
    ├── Global Mining Infrastructure Content Management
    ├── Role & Permission Management
    ├── Notification Management
    ├── Audit Logs
    ├── System Settings
    └── Email Management Center (NEW)
        ├── Email Provider Management
        ├── Email Template Management
        ├── Email Queue Monitor
        ├── Email Delivery Logs
        ├── Email Analytics Dashboard
        ├── Newsletter Campaign Manager
        ├── SMTP/API Test Center
        ├── Notification Settings
        └── Sender Identity Settings
```

### 3.2 Public Website

(All existing public website pages remain unchanged as per original PRD)

### 3.3 Authentication System

#### 3.3.1 Registration Page
- Collect user information: First Name, Last Name, Username, Email Address, Password, Confirm Password, Country
- Optional field: Referral Code
- Include CAPTCHA protection
- Create user account via Supabase Auth
- Send verification email automatically after registration
- User cannot access dashboard until email is verified

#### 3.3.2 Email Verification
- Send verification email with secure signed link
- Verification link expires after configurable duration (default 24 hours)
- Allow user to resend verification email
- Prevent duplicate verification attempts
- Send welcome email after successful verification
- Prevent login until email is verified

#### 3.3.3 Login Page
- Allow users to log in with email and password via Supabase Auth
- Support Two Factor Authentication: Email OTP, Google Authenticator, Authenticator Apps
- Track login history and device information
- Send security alert email for new device login or suspicious login attempts

#### 3.3.4 Forgot Password
- Allow users to request password reset via email
- Generate secure single-use token
- Send password reset email with expiring reset link
- Implement rate limiting to prevent abuse

#### 3.3.5 Reset Password
- Allow users to set new password using reset link
- Require password confirmation
- Send password changed confirmation email
- Invalidate reset token after use

### 3.4 User Dashboard

(All existing user dashboard pages remain unchanged as per original PRD)

### 3.5 Admin Dashboard

(All existing admin dashboard pages remain unchanged as per original PRD)

#### 3.5.23 Email Management Center (NEW)

Dedicated section for managing all email communications and notifications.

##### 3.5.23.1 Email Provider Management

**Provider List View:**
- Display all configured email providers in table format
- Show provider details: Provider Name, Type, Status, Priority, Daily Limit, Emails Sent Today, Success Rate
- Support multiple provider types: SMTP, Amazon SES, SendGrid, Mailgun, Postmark, Brevo, Resend, Custom SMTP
- Allow admin to add unlimited providers
- Display provider status: Active, Inactive, Error
- Show priority order for failover routing

**Add/Edit Provider:**
- Configure provider settings: Provider Name, Provider Type, SMTP Host, SMTP Port, Username, Password, API Key, Secret Key, Encryption (TLS/SSL/None), From Email, From Name, Reply-To Email, Daily Sending Limit, Status (Active/Inactive), Priority
- Test provider connection before saving
- Validate configuration fields based on provider type
- Store credentials securely in Supabase

**Provider Actions:**
- Enable/Disable provider instantly
- Set provider priority for failover routing
- Test connection and send test email
- View provider statistics and error logs
- Delete provider (with confirmation)
- Configure fallback providers

##### 3.5.23.2 Email Template Management

**Template Categories:**
- Authentication: Welcome, Verify Email, Password Reset, Login Alert
- Wallet: Deposit Detected, Deposit Confirmed, Deposit Failed, Withdrawal Requested, Withdrawal Approved, Withdrawal Rejected, Withdrawal Completed, Internal Transfer
- Mining: Contract Purchased, Contract Expires Soon, Contract Expired, Mining Rewards Credited, Maintenance Fees Deducted, Hardware Reassigned, Pool Maintenance, Mining Paused, Mining Resumed
- Security: Password Changed, Email Changed, 2FA Enabled, 2FA Disabled, Withdrawal Request, Wallet Address Changed, API Key Generated, Account Locked, Suspicious Activity
- Account: Profile Updated, KYC Submitted, KYC Approved, KYC Rejected, Referral Commission Earned, Referral Registered, Subscription Changes, Maintenance Announcement, Scheduled Downtime
- Support: Ticket Created, Staff Replied, Ticket Closed, Ticket Reopened, New Ticket (Staff), Escalated Ticket (Staff), High Priority Ticket (Staff)
- Newsletter: Custom campaign templates

**Template Editor:**
- Edit template subject line
- Edit HTML email body with visual editor
- Edit plain text version
- Preview template with sample data
- Insert dynamic variables: {{first_name}}, {{last_name}}, {{username}}, {{email}}, {{verification_link}}, {{reset_link}}, {{contract_name}}, {{hashrate}}, {{reward_amount}}, {{wallet_address}}, {{transaction_id}}, {{ticket_number}}, {{current_date}}, {{company_name}}, {{support_email}}, {{dashboard_link}}
- Send test email to specified address
- Restore template to default
- Duplicate template
- View version history

**Template Components:**
- Reusable components: Header, Footer, Buttons, Alerts, Tables, Stats Cards
- Responsive HTML design
- Mobile responsive layout
- Dark mode compatible
- Professional branding with company logo, colors, social links, footer

##### 3.5.23.3 Email Queue Monitor

**Queue Dashboard:**
- Display queue statistics: Total Queued, Processing, Completed Today, Failed Today, Pending Retry, Dead Letter Queue
- Show real-time queue processing status
- Display queue processing speed (emails per minute)

**Queue Management:**
- View queued emails with details: Recipient, Subject, Template, Provider, Status, Queued At, Retry Count
- Filter by status: Queued, Processing, Completed, Failed, Retry Pending
- Pause/Resume queue processing
- Retry failed emails individually or in bulk
- Delete emails from queue
- View email content and error details

**Queue Configuration:**
- Configure retry attempts (default 3)
- Configure retry delay with exponential backoff
- Configure dead letter queue threshold
- Set queue processing concurrency

##### 3.5.23.4 Email Delivery Logs

**Log View:**
- Display all sent emails with details: Recipient Email, Subject, Template Used, Provider Used, Delivery Status, Queue Status, Sent At, Opened At, Clicked At, Error Message, Retry Count
- Support search by recipient email, subject, template
- Filter by: Delivery Status (Delivered, Failed, Bounced, Complained), Date Range, Provider, Template
- Show open rate and click rate per email

**Log Actions:**
- View full email content (HTML and plain text)
- Retry failed delivery
- Export logs to CSV
- Delete old logs
- View detailed error information

##### 3.5.23.5 Email Analytics Dashboard

**Key Metrics:**
- Display metrics: Total Emails Sent, Successfully Delivered, Failed Deliveries, Pending Deliveries, Average Open Rate, Average Click Rate, Bounce Rate, Complaint Rate
- Show metrics for: Today, Last 7 Days, Last 30 Days, Custom Date Range

**Charts and Visualizations:**
- Daily Email Volume chart (line chart)
- Delivery Success Rate chart (area chart)
- Bounce Trends chart (line chart)
- Queue Processing Speed chart (line chart)
- Provider Performance comparison (bar chart)
- Template Performance comparison (table)

**Provider Analytics:**
- Compare provider performance: Emails Sent, Success Rate, Average Delivery Time, Error Rate
- Identify best performing provider
- Identify problematic providers

##### 3.5.23.6 Newsletter Campaign Manager

**Campaign List:**
- Display all campaigns: Campaign Name, Status, Recipients Count, Sent Date, Open Rate, Click Rate, Unsubscribe Rate
- Filter by status: Draft, Scheduled, Sending, Completed, Failed

**Create Campaign:**
- Enter campaign name and subject
- Select email template or create custom HTML
- Define recipient audience with filters: All Verified Users, Active Miners, Inactive Users, Country, Referral Level, Contract Type, Custom Segment
- Preview campaign
- Send test email
- Schedule send time or send immediately
- Save as draft

**Campaign Analytics:**
- Display campaign results: Total Recipients, Delivered, Opened, Clicked, Unsubscribed, Bounced, Complained
- Show open rate and click rate
- Display engagement timeline
- List recipients who opened/clicked

##### 3.5.23.7 SMTP/API Test Center

**Connection Test:**
- Select provider to test
- Test SMTP/API connection
- Verify authentication
- Measure response time
- Display connection status and errors

**Send Test Email:**
- Enter recipient email address
- Select template or compose custom message
- Send test email using selected provider
- Display delivery status and time

**DNS Recommendations:**
- Display SPF record recommendations
- Display DKIM record recommendations
- Display DMARC record recommendations
- Check current DNS configuration

**Provider Health Check:**
- Display provider health status
- Show recent error rate
- Display average delivery time
- Show daily sending limit usage

##### 3.5.23.8 Notification Settings

**Automated Email Triggers:**
- Configure which events trigger automated emails
- Enable/Disable email notifications per event type
- Event categories: Authentication, Security, Wallet, Mining, Account, Support

**Email Frequency Settings:**
- Configure email sending frequency limits per user
- Set daily email limit per user
- Configure digest email settings

**Recipient Preferences:**
- Allow users to manage email preferences from account settings
- Support unsubscribe from marketing emails
- Maintain transactional email delivery regardless of preferences

##### 3.5.23.9 Sender Identity Settings

**Default Sender Configuration:**
- Configure default From Email
- Configure default From Name
- Configure default Reply-To Email
- Configure company information for email footer

**Email Branding:**
- Upload company logo for email header
- Configure brand colors
- Configure social media links
- Configure footer text and links

**Compliance Settings:**
- Configure unsubscribe link text
- Configure physical mailing address for compliance
- Configure privacy policy link
- Configure terms of service link

## 4. Business Rules and Logic

### 4.1 Registration and Email Verification
- User must verify email before accessing dashboard
- Verification email sent automatically after registration
- Verification link contains secure signed token
- Verification link expires after configurable duration (default 24 hours)
- User can request new verification email
- Prevent duplicate verification attempts
- Welcome email sent automatically after successful verification
- Anti-spam protection prevents multiple registrations from same email
- CAPTCHA required during registration
- User authentication handled by Supabase Auth

### 4.2 Authentication and Security
- Session management tracks active sessions per user via Supabase Auth
- Device tracking records login devices and locations
- Security alert email sent automatically for new device login
- Security alert email sent for suspicious login attempts
- 2FA can be enforced at platform level or user level
- Failed login attempts trigger temporary account lock
- Email sent when 2FA is enabled or disabled

### 4.3 Password Recovery
- Password reset request generates secure single-use token
- Reset token expires after configurable duration
- Password reset email sent with expiring reset link
- Rate limiting prevents abuse of password reset feature
- Token invalidated after successful password reset
- Password changed confirmation email sent automatically
- Audit log records all password reset attempts

### 4.4 Email Provider Management
- Admin can add unlimited email providers
- Support multiple provider types: SMTP, Amazon SES, SendGrid, Mailgun, Postmark, Brevo, Resend, Custom SMTP
- Each provider has priority order for failover routing
- System automatically switches to backup provider if primary fails
- Provider credentials stored securely in Supabase
- Admin can enable/disable providers instantly
- Admin can test provider connection before saving
- Daily sending limit enforced per provider
- Provider statistics tracked: emails sent, success rate, error rate

### 4.5 Email Queue System
- All outgoing emails queued in Supabase database
- Queue processes emails asynchronously in background
- Automatic retry with exponential backoff for failed emails
- Configurable retry attempts (default 3)
- Failed emails moved to dead letter queue after max retries
- Admin can pause/resume queue processing
- Admin can retry or delete failed emails
- Queue statistics displayed in real-time
- Queue processing speed monitored

### 4.6 Email Template System
- All email templates stored in Supabase database
- Templates support HTML and plain text versions
- Templates are mobile responsive and dark mode compatible
- Dynamic variables replaced with actual data before sending
- Admin can edit templates via visual editor or HTML source
- Admin can preview templates with sample data
- Admin can send test emails
- Admin can restore templates to default
- Template version history maintained

### 4.7 Automated Email Notifications

**Security Emails (auto-send):**
- New login detected
- New device login
- Password changed
- Email changed
- 2FA enabled/disabled
- Withdrawal request
- Withdrawal completed
- Wallet address changed
- API key generated
- Account locked
- Suspicious activity detected

**Mining Notifications (auto-send):**
- Contract purchased
- Contract expires soon (7 days before expiry)
- Contract expired
- Mining rewards credited (daily)
- Maintenance fees deducted
- Hardware reassigned
- Pool maintenance scheduled
- Mining paused
- Mining resumed

**Wallet Emails (auto-send):**
- Deposit detected on blockchain
- Deposit confirmed after required confirmations
- Deposit failed
- Withdrawal requested
- Withdrawal pending admin approval
- Withdrawal approved
- Withdrawal rejected with reason
- Withdrawal completed with transaction hash
- Internal transfer completed

**Account Emails (auto-send):**
- Welcome email after email verification
- Profile updated
- KYC submitted
- KYC approved
- KYC rejected with reason
- Referral commission earned
- Referral registered
- Subscription changes
- Maintenance announcement
- Scheduled downtime notification

**Support Emails (auto-send):**
- Ticket created (to user)
- Staff replied to ticket (to user)
- Ticket closed (to user)
- Ticket reopened (to user)
- New ticket created (to staff)
- Ticket escalated (to staff)
- High priority ticket (to staff)

### 4.8 Email Delivery and Logging
- All sent emails logged in Supabase database
- Log includes: recipient, subject, template, provider, delivery status, timestamp, error message, retry count
- Track email open events (when recipient opens email)
- Track email click events (when recipient clicks links)
- Calculate open rate and click rate per email and per template
- Admin can search and filter email logs
- Admin can export logs to CSV
- Admin can retry failed deliveries

### 4.9 Newsletter Campaign System
- Admin can create newsletter campaigns
- Admin can select recipient audience with filters: verified users, active miners, inactive users, country, referral level, contract type
- Admin can schedule campaign or send immediately
- Admin can save campaign as draft
- Campaign statistics tracked: delivered, opened, clicked, unsubscribed, bounced
- Campaign analytics displayed in dashboard
- Users can unsubscribe from marketing emails
- Transactional emails always delivered regardless of unsubscribe status

### 4.10 Email Security and Compliance
- Verification links and reset links are signed and secure
- Rate limiting prevents email abuse
- Spam prevention mechanisms in place
- Email validation checks for valid format
- Disposable email detection
- SPF/DKIM/DMARC configuration guidance provided
- Unsubscribe link included in marketing emails
- Physical mailing address included for compliance
- Privacy policy and terms links included in footer

### 4.11 Email Internationalization
- Email templates support multiple languages
- Timestamps displayed in user's timezone
- Currency and date formats localized based on user's country

### 4.12 Email Analytics and Monitoring
- Email analytics dashboard displays key metrics
- Metrics include: emails sent, delivered, failed, open rate, click rate, bounce rate, complaint rate
- Charts visualize email volume, delivery success, bounce trends, queue processing speed
- Provider performance compared and displayed
- Template performance tracked and displayed
- Admin can identify best performing providers and templates

### 4.13 SMTP/API Testing
- Admin can test provider connection before saving
- Test center allows sending test emails
- Connection status and errors displayed
- DNS recommendations provided for SPF/DKIM/DMARC
- Provider health status monitored

(All other existing business rules from original PRD remain unchanged)

## 5. Exception and Boundary Conditions

| Scenario | Handling |
|----------|----------|
| User registers with existing email | Display error: Email already registered |
| User attempts login without email verification | Display error: Please verify your email first |
| Verification link expired | Allow user to request new verification email |
| User clicks verification link multiple times | Display message: Email already verified |
| User forgets password | Send password reset email with secure token |
| Password reset link expired | Display error: Reset link expired, request new one |
| Password reset link used multiple times | Display error: Reset link already used |
| Email provider connection fails | Switch to backup provider automatically |
| All email providers unavailable | Queue email for retry, alert admin |
| Email queue processing fails | Retry with exponential backoff, move to dead letter queue after max retries |
| Email delivery fails permanently | Log failure, notify admin, allow manual retry |
| Email template variable missing | Replace with empty string or default value |
| User unsubscribes from marketing emails | Stop sending marketing emails, continue transactional emails |
| Newsletter campaign recipient list empty | Display error: No recipients match selected filters |
| Admin sends test email to invalid address | Display error: Invalid email address |
| Email provider daily limit reached | Switch to next available provider |
| Email open/click tracking fails | Log error, continue email delivery |
| Admin deletes email template in use | Prevent deletion, display error: Template in use |
| Admin edits email template | Changes apply to new emails only, queued emails use original template |
| Email queue paused by admin | Stop processing, resume when admin resumes queue |
| Email provider credentials invalid | Display error, disable provider, alert admin |
| SMTP connection timeout | Retry with next provider, log error |
| Email bounces (hard bounce) | Mark email as invalid, stop sending to address |
| Email marked as spam (complaint) | Log complaint, review sending practices |
| User changes email address | Send verification email to new address, keep old address until verified |
| Admin tests provider with invalid config | Display connection error, prevent saving |
| Newsletter campaign scheduled in past | Display error: Schedule time must be in future |
| Email template HTML invalid | Display validation error, prevent saving |
| Email log storage exceeds limit | Archive old logs, implement log rotation |
| Multiple admins edit same template | Last save wins, display warning about concurrent edits |

(All other existing exception scenarios from original PRD remain unchanged)

## 6. Acceptance Criteria

1. User registers account with email, password, and personal information via Supabase Auth
2. User receives verification email automatically after registration
3. User clicks verification link in email to verify account
4. User receives welcome email after successful verification
5. User cannot log in until email is verified
6. User can request new verification email if link expires
7. User requests password reset via forgot password page
8. User receives password reset email with secure link
9. User sets new password using reset link
10. User receives password changed confirmation email
11. User logs in from new device and receives security alert email
12. Admin accesses Email Management Center in Admin Dashboard
13. Admin adds new email provider with configuration: Provider Name, Type, SMTP Host, Port, Username, Password, API Key, Encryption, From Email, From Name, Reply-To Email, Daily Limit, Status, Priority
14. Admin tests email provider connection before saving
15. Admin enables/disables email provider
16. Admin sets provider priority for failover routing
17. Admin views email provider list with status and statistics
18. Admin accesses Email Template Management
19. Admin views all email templates organized by category
20. Admin edits email template subject and HTML body
21. Admin inserts dynamic variables into template
22. Admin previews email template with sample data
23. Admin sends test email to verify template
24. Admin restores template to default
25. Admin accesses Email Queue Monitor
26. Admin views queue statistics: Total Queued, Processing, Completed, Failed, Pending Retry
27. Admin views queued emails with details
28. Admin pauses/resumes queue processing
29. Admin retries failed emails
30. Admin deletes emails from queue
31. Admin accesses Email Delivery Logs
32. Admin views all sent emails with delivery status
33. Admin searches logs by recipient email or subject
34. Admin filters logs by delivery status, date range, provider, template
35. Admin exports logs to CSV
36. Admin views email open rate and click rate
37. Admin accesses Email Analytics Dashboard
38. Admin views key metrics: Emails Sent, Delivered, Failed, Open Rate, Click Rate, Bounce Rate
39. Admin views charts: Daily Email Volume, Delivery Success Rate, Bounce Trends, Queue Processing Speed
40. Admin compares provider performance
41. Admin identifies best performing email templates
42. Admin accesses Newsletter Campaign Manager
43. Admin creates new newsletter campaign
44. Admin selects recipient audience with filters: All Verified Users, Active Miners, Country, Referral Level
45. Admin previews campaign and sends test email
46. Admin schedules campaign or sends immediately
47. Admin views campaign analytics: Delivered, Opened, Clicked, Unsubscribed
48. Admin accesses SMTP/API Test Center
49. Admin tests email provider connection
50. Admin sends test email using selected provider
51. Admin views DNS recommendations for SPF/DKIM/DMARC
52. Admin checks provider health status
53. Admin accesses Notification Settings
54. Admin enables/disables automated email triggers per event type
55. Admin configures email frequency limits
56. Admin accesses Sender Identity Settings
57. Admin configures default From Email, From Name, Reply-To Email
58. Admin uploads company logo for email header
59. Admin configures brand colors and social media links
60. User purchases mining contract and receives contract purchased email
61. User receives mining rewards credited email daily
62. User deposits funds and receives deposit detected email
63. User receives deposit confirmed email after blockchain confirmations
64. User requests withdrawal and receives withdrawal requested email
65. User receives withdrawal completed email with transaction hash
66. User enables 2FA and receives 2FA enabled email
67. User changes password and receives password changed email
68. User submits KYC and receives KYC submitted email
69. User receives KYC approved email after admin approval
70. User creates support ticket and receives ticket created email
71. User receives staff replied email when support responds
72. User refers new user and receives referral commission earned email
73. System automatically sends contract expires soon email 7 days before expiry
74. System automatically sends contract expired email when contract ends
75. System sends security alert email for suspicious activity
76. Email queue processes emails asynchronously in background
77. Failed emails automatically retry with exponential backoff
78. System switches to backup provider when primary provider fails
79. All sent emails logged in database with delivery status
80. Email open and click events tracked and logged

## 7. Out of Scope for Current Release

- Mobile native applications (iOS/Android)
- Live chat support integration
- SMS notifications
- Multi-language support beyond English
- Fiat currency deposits (credit card, bank transfer)
- Automated trading features
- Mining pool switching by users
- Hardware rental marketplace
- NFT integration
- Staking features
- Lending/borrowing features
- Social features (user profiles, following, messaging)
- Gamification elements (badges, leaderboards)
- Advanced analytics (machine learning predictions)
- White-label solutions
- API for third-party integrations
- Margin trading
- Futures contracts
- Options trading
- A/B testing for email templates
- Advanced email personalization based on user behavior
- Email marketing automation workflows
- Drip email campaigns
- Email list segmentation beyond basic filters
- Email deliverability scoring
- Email spam testing tools
- Email template marketplace
- Third-party email template integrations
- Advanced email analytics (heatmaps, engagement scoring)
- Email preference center for users
- Email forwarding and aliasing
- Email archiving and compliance features
- Email encryption (PGP/S/MIME)
- Email signature management
- Email scheduling for individual users
- Email reminders and follow-ups
- Email collaboration features
- Email approval workflows
- Email versioning and rollback
- Email localization beyond basic timezone support
- Email accessibility features (screen reader optimization)
- Email dark mode testing tools
- Email client compatibility testing
- Email rendering preview across devices
- Email link tracking with UTM parameters
- Email conversion tracking
- Email revenue attribution
- Email ROI calculation
- Email sentiment analysis
- Email feedback collection
- Email survey integration
- Email social sharing features
- Email referral tracking
- Email loyalty program integration