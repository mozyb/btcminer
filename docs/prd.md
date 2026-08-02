# Requirements Document

## 1. Application Overview

### 1.1 Application Name
BTCMiner.online

### 1.2 Application Description
An enterprise-grade cloud mining and hashrate marketplace platform with integrated Enterprise Email System, Notification Center, and Conversion & Email Marketing Automation System. This is a legitimate cloud mining infrastructure platform focused on hashrate trading, mining contract management, mining farm operations, comprehensive email communication management, and automated marketing funnel optimization.

## 2. Users and Usage Scenarios

### 2.1 Target Users
- Individual miners seeking to purchase hashrate
- Mining enthusiasts wanting to participate in cloud mining
- Users interested in cryptocurrency mining without hardware ownership
- Affiliates promoting the platform
- Platform administrators managing operations, email communications, and marketing campaigns
- Support staff managing customer communications
- Marketing team managing conversion funnels and promotional campaigns

### 2.2 Core Usage Scenarios
- Visitors explore platform and capture email leads through promotional popups
- Visitors register accounts and receive automated verification reminders
- Registered users receive educational email sequences to guide first deposit
- Users with deposits receive guidance to purchase first mining contract
- Users who abandon contract purchases receive automated recovery reminders
- Administrators create and manage marketing campaigns with audience segmentation
- Administrators configure promotional offers and discount codes
- Administrators monitor conversion funnel performance and campaign analytics
- Users purchase hashrate contracts from marketplace with applied promotions
- Users monitor mining performance and rewards
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
│   ├── Homepage (with Smart Promotional Popup)
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
│   ├── Hashrate Marketplace (with Promotion Display)
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
│   ├── Security Settings
│   └── Email Preferences (NEW)
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
    ├── Email Management Center
    │   ├── Email Provider Management
    │   ├── Email Template Management
    │   ├── Email Queue Monitor
    │   ├── Email Delivery Logs
    │   ├── Email Analytics Dashboard
    │   ├── Newsletter Campaign Manager
    │   ├── SMTP/API Test Center
    │   ├── Notification Settings
    │   └── Sender Identity Settings
    └── Marketing Automation Center (NEW)
        ├── Smart Popup Manager
        ├── Lead Capture Management
        ├── Automation Sequence Manager
        ├── Campaign Manager
        ├── Audience Segmentation
        ├── Marketing Email Templates
        ├── Promotion & Discount Engine
        ├── Abandoned Purchase Tracker
        ├── Marketing Analytics Dashboard
        └── Compliance & Consent Management
```

### 3.2 Public Website

(All existing public website pages remain unchanged as per original PRD)

#### 3.2.1 Smart Promotional Popup (NEW)

**Display Triggers:**
- Show after 20-30 seconds on site
- Show after 50% page scroll
- Show on exit intent detection
- Show after visiting multiple pages without registering

**Display Rules:**
- Never show to logged-in users
- Never show to users with qualifying purchases
- Never show to users who dismissed popup within configurable cooldown period
- Respect display frequency settings configured by admin

**Popup Content:**
- Display title
- Display subtitle
- Display description text
- Display background image
- Display promotional banner
- Display call-to-action button with configurable text
- Link to configurable CTA destination

**User Actions:**
- Enter email address and optional first name
- Click CTA button to proceed
- Dismiss popup

### 3.3 Authentication System

(All existing authentication pages remain unchanged as per original PRD)

### 3.4 User Dashboard

(All existing user dashboard pages remain unchanged as per original PRD)

#### 3.4.1 Email Preferences (NEW)

**Subscription Management:**
- Display current email subscription status
- Allow user to opt-in or opt-out of marketing emails
- Display subscription categories: Marketing Emails, Educational Content, Promotional Offers, Product Updates, Newsletter
- Allow user to update email preferences
- Display consent timestamp

**Preference Actions:**
- Enable/disable specific email categories
- Unsubscribe from all marketing emails
- View email subscription history

**Note:**
- Transactional emails always delivered regardless of preferences
- Marketing emails respect opt-out preferences

### 3.5 Admin Dashboard

(All existing admin dashboard pages remain unchanged as per original PRD)

#### 3.5.1 Email Management Center

(All existing email management pages remain unchanged as per original PRD)

#### 3.5.2 Marketing Automation Center (NEW)

##### 3.5.2.1 Smart Popup Manager

**Popup Configuration:**
- Configure popup title
- Configure popup subtitle
- Configure popup description
- Upload background image
- Upload promotional banner
- Configure button text
- Configure CTA destination URL
- Set popup expiration date
- Configure display frequency
- Set cooldown period after dismissal

**Display Trigger Settings:**
- Enable/disable time-based trigger (20-30 seconds)
- Enable/disable scroll-based trigger (50% scroll)
- Enable/disable exit intent trigger
- Enable/disable multi-page visit trigger

**Exclusion Rules:**
- Exclude logged-in users
- Exclude users with qualifying purchases
- Exclude users who dismissed within cooldown period

**Popup Actions:**
- Activate/deactivate popup
- Preview popup
- Duplicate popup configuration
- View popup performance statistics

##### 3.5.2.2 Lead Capture Management

**Lead List View:**
- Display captured leads: Email, First Name, Capture Date, Source, Status, Tags
- Filter by: Capture Date, Source, Status, Tags
- Search by email or name
- Export leads to CSV

**Lead Details:**
- View lead information
- View capture source
- View associated tags
- View email engagement history
- Manually add tags
- Convert lead to registered user

**Lead Actions:**
- Send welcome email
- Add to marketing campaign
- Tag lead
- Delete lead

##### 3.5.2.3 Automation Sequence Manager

**Sequence Types:**
- Unverified User Reminder Sequence
- Verified but No Deposit Sequence
- Deposit but No Contract Sequence
- Abandoned Contract Purchase Sequence

**Unverified User Reminder Sequence:**
- Configure reminder emails at: 1 hour, 24 hours, 3 days, 7 days after registration
- Each email includes: Verification button, Platform benefits, Support contact
- Sequence stops immediately upon email verification

**Verified but No Deposit Sequence:**
- Configure emails at: 1 day, 3 days, 7 days, 14 days after verification
- Email topics: Getting Started Guide, How Cloud Mining Works, Choosing the Right Contract, Current Opportunities, Platform Features, Educational Resources
- Attach promotional offers to emails
- Sequence stops upon first successful deposit

**Deposit but No Contract Sequence:**
- Configure reminder emails explaining contract purchase process
- Include: Available contracts, Reward calculations, Mining farms, Mining pools
- Sequence stops upon first contract purchase

**Abandoned Contract Purchase Sequence:**
- Configure reminders at: 2 hours, 24 hours, 72 hours after abandonment
- Include link back to unfinished purchase
- Display selected contract details
- Sequence stops upon contract purchase completion

**Sequence Configuration:**
- Enable/disable sequence
- Edit email timing
- Edit email content
- Attach promotions
- Set sequence priority
- View sequence performance

##### 3.5.2.4 Campaign Manager

**Campaign List View:**
- Display campaigns: Campaign Name, Type, Status, Audience, Scheduled Date, Sent Date, Performance Metrics
- Filter by: Campaign Type, Status, Date Range
- Search by campaign name

**Campaign Types:**
- Welcome
- Educational
- Promotional
- Seasonal
- Product Launch
- Newsletter
- Feature Announcement

**Create Campaign:**
- Enter campaign name
- Select campaign type
- Select email template
- Define target audience with segmentation filters
- Attach promotions or discount codes
- Preview campaign
- Send test email
- Schedule send time or send immediately
- Save as draft

**Campaign Actions:**
- Pause active campaign
- Resume paused campaign
- Duplicate campaign
- Archive campaign
- View campaign analytics
- Export campaign results

##### 3.5.2.5 Audience Segmentation

**Segment Types:**
- Visitors (captured email leads)
- Registered Users
- Verified Users
- Unverified Users
- Users with No Deposits
- Users with No Active Contracts
- Active Miners
- Inactive Users
- High-Value Customers
- Referral Users

**Segmentation Filters:**
- Country
- Registration Date Range
- Total Deposits Amount Range
- Total Hashrate Range
- Contract Type
- Preferred Coin
- Last Activity Date
- Email Engagement Level
- Referral Status

**Segment Actions:**
- Create custom segment
- Save segment for reuse
- View segment size
- Export segment to CSV
- Apply segment to campaign

##### 3.5.2.6 Marketing Email Templates

**Template Categories:**
- Welcome Email
- Verify Email Reminder
- Getting Started Guide
- Reminder to Verify
- No Deposit Yet
- No Contract Yet
- Abandoned Purchase Reminder
- New Mining Contract Announcement
- Feature Updates
- Educational Content
- Newsletter
- Promotional Offers

**Template Editor:**
- Edit template subject line
- Edit HTML email body with visual editor
- Edit plain text version
- Insert dynamic variables
- Preview template with sample data
- Send test email
- Duplicate template
- Restore to default

**Template Management:**
- Activate/deactivate template
- View template usage statistics
- View template performance metrics

##### 3.5.2.7 Promotion & Discount Engine

**Promotion Types:**
- Percentage Discount
- Fixed Amount Discount
- Bonus Hashpower
- Maintenance Fee Discount
- Coupon Code
- Limited-Time Campaign

**Create Promotion:**
- Enter promotion name
- Select promotion type
- Configure discount value or bonus amount
- Set start date and end date
- Set maximum redemptions limit
- Define eligible user segments
- Select applicable contracts
- Set minimum purchase requirements
- Generate coupon code (if applicable)
- Configure auto-apply rules

**Promotion Configuration:**
- Enable/disable promotion
- Set promotion priority
- Configure stacking rules
- Set usage limits per user
- Configure display settings

**Promotion Actions:**
- Activate/deactivate promotion
- Duplicate promotion
- View promotion performance
- Export promotion usage data

**Checkout Integration:**
- Automatically apply valid promotions at checkout
- Display applied discount amount
- Allow user to enter coupon code
- Validate coupon code and apply discount
- Display promotion terms and conditions

##### 3.5.2.8 Abandoned Purchase Tracker

**Tracking Mechanism:**
- Record selected contract details when user enters purchase flow
- Record timestamp of abandonment
- Record user ID
- Track abandonment stage

**Abandoned Purchase List:**
- Display abandoned purchases: User Email, Contract Name, Hashrate, Price, Abandonment Date, Stage, Status
- Filter by: Date Range, Contract Type, Stage, Status
- Search by user email

**Recovery Actions:**
- Send manual recovery email
- Apply special discount
- View recovery email history
- Mark as recovered or lost

##### 3.5.2.9 Marketing Analytics Dashboard

**Conversion Funnel Metrics:**
- Visitor to Email Lead conversion rate
- Email Lead to Registered User conversion rate
- Registered to Verified User conversion rate
- Verified to First Deposit conversion rate
- First Deposit to First Contract conversion rate
- First Contract to Repeat Customer conversion rate

**Popup Performance:**
- Total popup impressions
- Popup conversion rate
- Email captures from popup
- Dismissal rate
- Average time to conversion

**Campaign Performance:**
- Campaign open rate
- Campaign click-through rate
- Campaign conversion rate
- Revenue generated by campaign
- Cost per acquisition

**Sequence Performance:**
- Sequence completion rate
- Average time to target action
- Sequence drop-off points
- Revenue attributed to sequence

**Promotion Performance:**
- Total redemptions
- Revenue with promotions
- Discount amount given
- Average order value with promotion
- Promotion ROI

**Charts and Visualizations:**
- Conversion funnel chart
- Daily email captures chart
- Campaign performance comparison chart
- Sequence effectiveness chart
- Promotion usage trends chart
- Revenue by marketing channel chart

##### 3.5.2.10 Compliance & Consent Management

**Consent Tracking:**
- Record email capture consent timestamp
- Record marketing email opt-in status
- Record consent source
- Track consent changes history

**Double Opt-In Configuration:**
- Enable/disable double opt-in requirement
- Configure confirmation email template
- Set confirmation link expiration

**Unsubscribe Management:**
- Display unsubscribed users list
- Record unsubscribe reason
- Record unsubscribe timestamp
- Prevent sending marketing emails to unsubscribed users

**Email Preference Compliance:**
- Respect user email preferences
- Separate transactional from marketing emails
- Always deliver transactional emails
- Never send marketing emails to opted-out users

**Compliance Reports:**
- Generate consent audit report
- Generate unsubscribe report
- Export compliance data

## 4. Business Rules and Logic

### 4.1 Registration and Email Verification

(All existing registration and verification rules remain unchanged as per original PRD)

### 4.2 Authentication and Security

(All existing authentication and security rules remain unchanged as per original PRD)

### 4.3 Password Recovery

(All existing password recovery rules remain unchanged as per original PRD)

### 4.4 Email Provider Management

(All existing email provider management rules remain unchanged as per original PRD)

### 4.5 Email Queue System

(All existing email queue system rules remain unchanged as per original PRD)

### 4.6 Email Template System

(All existing email template system rules remain unchanged as per original PRD)

### 4.7 Automated Email Notifications

(All existing automated email notification rules remain unchanged as per original PRD)

### 4.8 Email Delivery and Logging

(All existing email delivery and logging rules remain unchanged as per original PRD)

### 4.9 Newsletter Campaign System

(All existing newsletter campaign system rules remain unchanged as per original PRD)

### 4.10 Email Security and Compliance

(All existing email security and compliance rules remain unchanged as per original PRD)

### 4.11 Email Internationalization

(All existing email internationalization rules remain unchanged as per original PRD)

### 4.12 Email Analytics and Monitoring

(All existing email analytics and monitoring rules remain unchanged as per original PRD)

### 4.13 SMTP/API Testing

(All existing SMTP/API testing rules remain unchanged as per original PRD)

### 4.14 Smart Promotional Popup Logic (NEW)

**Display Trigger Logic:**
- Popup displays after 20-30 seconds on site (configurable)
- Popup displays after user scrolls 50% of page
- Popup displays on exit intent detection (mouse moves toward browser close button)
- Popup displays after user visits multiple pages without registering (configurable threshold)

**Display Exclusion Logic:**
- Never display to logged-in users
- Never display to users with qualifying purchases (defined by admin)
- Never display to users who dismissed popup within cooldown period (configurable)
- Respect display frequency limit (e.g., once per session, once per day)

**Popup Expiration:**
- Popup automatically deactivates after configured expiration date
- Admin can manually deactivate popup before expiration

**Popup Tracking:**
- Track popup impressions per user
- Track popup dismissals
- Track email captures from popup
- Track conversions from popup (registration, deposit, contract purchase)

### 4.15 Lead Capture and Management (NEW)

**Lead Capture Process:**
- Collect email address and optional first name from visitor
- Validate email format
- Check for duplicate email in lead database
- Save lead to database with capture timestamp and source
- Send welcome email to captured lead
- Tag lead in marketing system
- Prevent duplicate lead creation for same email

**Lead Conversion:**
- When lead registers account, link lead record to user account
- Update lead status to Converted
- Stop sending lead nurture emails
- Begin sending registered user email sequences

### 4.16 Automated Email Sequences (NEW)

**Unverified User Reminder Sequence:**
- Trigger: User registers but does not verify email
- Send reminder emails at: 1 hour, 24 hours, 3 days, 7 days after registration
- Each email includes: Verification button, Platform benefits, Support contact information
- Stop sequence immediately when user verifies email
- Do not send if user already verified

**Verified but No Deposit Sequence:**
- Trigger: User verifies email but does not make first deposit
- Send educational emails at: 1 day, 3 days, 7 days, 14 days after verification
- Email topics: Getting Started Guide, How Cloud Mining Works, Choosing the Right Contract, Current Opportunities, Platform Features, Educational Resources
- Admin can attach promotional offers to emails
- Stop sequence immediately when user makes first successful deposit
- Do not send if user already deposited

**Deposit but No Contract Sequence:**
- Trigger: User makes deposit but does not purchase mining contract
- Send reminder emails explaining contract purchase process
- Include: Available contracts, Reward calculations, Mining farms, Mining pools
- Stop sequence immediately when user purchases first contract
- Do not send if user already purchased contract

**Abandoned Contract Purchase Sequence:**
- Trigger: User selects contract and enters purchase flow but does not complete purchase
- Record selected contract details, timestamp, user ID
- Send recovery emails at: 2 hours, 24 hours, 72 hours after abandonment
- Include link back to unfinished purchase with pre-filled contract details
- Stop sequence immediately when user completes contract purchase
- Do not send if user already completed purchase

**Sequence Priority:**
- Only one sequence active per user at a time
- Sequence priority order: Unverified User > Verified but No Deposit > Deposit but No Contract > Abandoned Purchase
- When user completes target action, stop current sequence and evaluate next applicable sequence

### 4.17 Marketing Campaign Management (NEW)

**Campaign Creation:**
- Admin creates campaign with name, type, email template, target audience, schedule
- Admin can attach promotions or discount codes to campaign
- Admin can preview campaign and send test email
- Admin can save campaign as draft or schedule for future send

**Campaign Execution:**
- System sends campaign to target audience at scheduled time
- System respects user email preferences and opt-out status
- System tracks email delivery, opens, clicks, conversions
- System calculates campaign performance metrics

**Campaign Actions:**
- Admin can pause active campaign to stop sending
- Admin can resume paused campaign
- Admin can duplicate campaign for reuse
- Admin can archive completed campaigns

### 4.18 Audience Segmentation Logic (NEW)

**Segment Definition:**
- Admin defines segment by selecting user attributes and applying filters
- Segment types: Visitors, Registered, Verified, Unverified, No Deposits, No Active Contracts, Active Miners, Inactive Users, High-Value Customers, Referral Users
- Filters: Country, Registration Date, Total Deposits, Total Hashrate, Contract Type, Preferred Coin, Last Activity Date, Email Engagement Level, Referral Status

**Segment Calculation:**
- System calculates segment size in real-time based on current user data
- Segment membership updates dynamically as user attributes change
- Admin can preview segment members before applying to campaign

**Segment Application:**
- Admin applies segment to campaign to target specific audience
- System sends campaign only to users matching segment criteria
- System respects email preferences and opt-out status within segment

### 4.19 Promotion and Discount Engine (NEW)

**Promotion Creation:**
- Admin creates promotion with type, value, dates, eligibility, applicable contracts, requirements
- Promotion types: Percentage Discount, Fixed Discount, Bonus Hashpower, Maintenance Fee Discount, Coupon Code, Limited-Time Campaign
- Admin sets start date, end date, maximum redemptions, eligible user segments, minimum purchase requirements

**Promotion Application:**
- System automatically applies valid promotions at checkout based on eligibility rules
- User can manually enter coupon code at checkout
- System validates coupon code and applies discount if valid
- System displays applied discount amount and final price
- System enforces usage limits per user and total redemptions limit

**Promotion Stacking:**
- Admin configures whether promotions can stack with other promotions
- System applies highest value promotion if stacking not allowed
- System applies all eligible promotions if stacking allowed

**Promotion Expiration:**
- Promotion automatically deactivates after end date
- Promotion deactivates when maximum redemptions reached
- Admin can manually deactivate promotion before expiration

### 4.20 Abandoned Purchase Tracking (NEW)

**Abandonment Detection:**
- System records contract selection when user enters purchase flow
- System records timestamp of abandonment when user exits without completing purchase
- System records user ID and abandonment stage
- Abandonment stages: Contract Selected, Payment Method Selected, Payment Initiated

**Recovery Email Trigger:**
- System sends recovery emails at: 2 hours, 24 hours, 72 hours after abandonment
- Recovery email includes link back to unfinished purchase with pre-filled contract details
- Recovery email may include special discount or promotion
- System stops sending recovery emails when user completes purchase

**Abandonment Analytics:**
- System tracks abandonment rate by stage
- System tracks recovery rate from recovery emails
- System calculates revenue recovered from abandoned purchases

### 4.21 Marketing Analytics and Reporting (NEW)

**Conversion Funnel Tracking:**
- System tracks user progression through funnel: Visitor → Email Lead → Registered User → Verified User → First Deposit → First Contract → Repeat Customer
- System calculates conversion rate at each funnel stage
- System identifies drop-off points in funnel

**Campaign Performance Tracking:**
- System tracks campaign metrics: Emails Sent, Delivered, Opened, Clicked, Converted
- System calculates campaign open rate, click-through rate, conversion rate
- System attributes revenue to campaigns
- System calculates cost per acquisition and ROI

**Sequence Performance Tracking:**
- System tracks sequence completion rate
- System tracks average time to target action
- System identifies sequence drop-off points
- System attributes revenue to sequences

**Promotion Performance Tracking:**
- System tracks promotion redemptions
- System tracks revenue with promotions applied
- System calculates discount amount given
- System calculates average order value with promotion
- System calculates promotion ROI

### 4.22 Compliance and Consent Management (NEW)

**Consent Recording:**
- System records email capture consent timestamp when visitor submits email
- System records marketing email opt-in status
- System records consent source (popup, registration form, email preferences)
- System tracks consent changes history

**Double Opt-In:**
- Admin can enable double opt-in requirement
- System sends confirmation email to captured lead
- Lead must click confirmation link to complete opt-in
- System records confirmation timestamp

**Unsubscribe Handling:**
- User can unsubscribe from marketing emails via unsubscribe link in email footer
- User can manage email preferences in account settings
- System records unsubscribe timestamp and reason
- System stops sending marketing emails to unsubscribed users immediately
- System continues sending transactional emails regardless of unsubscribe status

**Email Preference Enforcement:**
- System checks user email preferences before sending marketing emails
- System never sends marketing emails to opted-out users
- System always sends transactional emails regardless of preferences
- System separates transactional from marketing email categories

### 4.23 Integration with Existing Systems (NEW)

**Authentication System Integration:**
- Marketing automation system uses Supabase Auth for user authentication
- Lead records linked to user accounts upon registration
- Email sequences triggered based on authentication events (registration, verification)

**Email System Integration:**
- Marketing emails sent through existing email provider (Resend)
- Marketing emails use existing email queue system
- Marketing email delivery logged in existing email delivery logs
- Marketing email analytics integrated with existing email analytics dashboard

**Contract System Integration:**
- Abandoned purchase tracking monitors contract purchase flow
- Promotions applied at contract checkout
- Contract purchase events trigger sequence stops and funnel progression

**CRM Integration:**
- Lead data synchronized with CRM system
- User segmentation uses CRM data attributes
- Campaign performance data exported to CRM

**Analytics Integration:**
- Marketing analytics data integrated with existing platform analytics
- Conversion funnel metrics displayed in admin dashboard
- Campaign performance metrics tracked alongside other platform metrics

**Notification System Integration:**
- Marketing emails respect existing notification preferences
- Marketing email triggers added to existing notification management system
- Marketing email templates managed alongside existing email templates

## 5. Exception and Boundary Conditions

(All existing exception scenarios from original PRD remain unchanged)

| Scenario | Handling |
|----------|----------|
| Visitor submits invalid email in popup | Display error: Invalid email address |
| Visitor submits duplicate email in popup | Save lead if not already captured, send welcome email |
| Popup display trigger fires for logged-in user | Do not display popup |
| Popup display trigger fires for user with qualifying purchase | Do not display popup |
| Popup display trigger fires within cooldown period | Do not display popup |
| User verifies email while unverified reminder sequence active | Stop sequence immediately |
| User makes deposit while verified but no deposit sequence active | Stop sequence immediately |
| User purchases contract while deposit but no contract sequence active | Stop sequence immediately |
| User completes purchase while abandoned purchase sequence active | Stop sequence immediately |
| User opts out of marketing emails | Stop all marketing sequences, continue transactional emails |
| Campaign scheduled for past date | Display error: Schedule time must be in future |
| Campaign target audience empty | Display error: No users match selected filters |
| Promotion start date after end date | Display error: Start date must be before end date |
| Promotion maximum redemptions reached | Deactivate promotion automatically |
| User enters invalid coupon code at checkout | Display error: Invalid or expired coupon code |
| User attempts to use expired promotion | Display error: Promotion has expired |
| User attempts to use promotion not eligible for | Display error: You are not eligible for this promotion |
| User attempts to use promotion on ineligible contract | Display error: Promotion not applicable to selected contract |
| User does not meet minimum purchase requirement for promotion | Display error: Minimum purchase requirement not met |
| Multiple promotions eligible for same purchase | Apply highest value promotion or stack if allowed |
| Abandoned purchase recovery email sent after purchase completed | Do not send, mark as recovered |
| Lead converts to registered user | Link lead record to user account, update status to Converted |
| Admin deletes email template used in active campaign | Prevent deletion, display error: Template in use |
| Admin deactivates promotion during active campaign | Promotion no longer applied to new purchases |
| User changes email address | Update email in all marketing systems, send verification to new email |
| Email sequence email fails to send | Retry with existing email queue retry logic |
| Marketing email bounces (hard bounce) | Mark email as invalid, stop sending marketing emails to address |
| Marketing email marked as spam | Log complaint, review sending practices, consider removing from list |
| Double opt-in confirmation link expired | Allow user to request new confirmation email |
| User clicks unsubscribe link multiple times | Display message: Already unsubscribed |
| Admin creates segment with no matching users | Display warning: Segment is empty |
| Campaign sending fails due to email provider error | Retry with backup provider, log error |
| Popup configuration missing required fields | Display validation error, prevent saving |
| Promotion usage limit per user exceeded | Display error: You have already used this promotion |
| Abandoned purchase tracked for guest user | Store abandonment data, send recovery email if email captured |
| Marketing analytics data exceeds storage limit | Archive old data, implement data retention policy |
| Multiple admins edit same campaign simultaneously | Last save wins, display warning about concurrent edits |

## 6. Acceptance Criteria

1. Visitor lands on homepage and smart promotional popup displays after 20-30 seconds
2. Visitor scrolls 50% of page and popup displays
3. Visitor moves mouse toward browser close button and exit intent popup displays
4. Visitor visits multiple pages without registering and popup displays
5. Popup does not display to logged-in users
6. Popup does not display to users with qualifying purchases
7. Popup does not display to users who dismissed within cooldown period
8. Visitor enters email and optional first name in popup
9. System saves lead to database with capture timestamp and source
10. System sends welcome email to captured lead
11. System tags lead in marketing system
12. System prevents duplicate lead creation for same email
13. User registers account but does not verify email
14. System sends unverified user reminder emails at 1 hour, 24 hours, 3 days, 7 days after registration
15. Each reminder email includes verification button, platform benefits, support contact
16. System stops unverified user reminder sequence immediately when user verifies email
17. User verifies email but does not make deposit
18. System sends verified but no deposit emails at 1 day, 3 days, 7 days, 14 days after verification
19. Emails include: Getting Started Guide, How Cloud Mining Works, Choosing the Right Contract, Current Opportunities, Platform Features, Educational Resources
20. System stops verified but no deposit sequence immediately when user makes first deposit
21. User makes deposit but does not purchase contract
22. System sends deposit but no contract reminder emails
23. Emails explain contract purchase process, available contracts, reward calculations, farms, pools
24. System stops deposit but no contract sequence immediately when user purchases first contract
25. User selects contract and enters purchase flow but abandons before completion
26. System records selected contract details, timestamp, user ID, abandonment stage
27. System sends abandoned purchase recovery emails at 2 hours, 24 hours, 72 hours after abandonment
28. Recovery email includes link back to unfinished purchase with pre-filled contract details
29. System stops abandoned purchase sequence immediately when user completes purchase
30. Admin accesses Marketing Automation Center in Admin Dashboard
31. Admin accesses Smart Popup Manager
32. Admin configures popup: title, subtitle, description, background image, promotional banner, button text, CTA destination, expiration date, display frequency, cooldown period
33. Admin enables/disables display triggers: time-based, scroll-based, exit intent, multi-page visit
34. Admin configures exclusion rules: logged-in users, users with purchases, dismissed users
35. Admin activates popup
36. Admin previews popup
37. Admin views popup performance statistics: impressions, conversion rate, email captures, dismissal rate
38. Admin accesses Lead Capture Management
39. Admin views captured leads list with details: email, first name, capture date, source, status, tags
40. Admin filters leads by date, source, status, tags
41. Admin searches leads by email or name
42. Admin exports leads to CSV
43. Admin views lead details and email engagement history
44. Admin manually adds tags to lead
45. Admin sends welcome email to lead
46. Admin accesses Automation Sequence Manager
47. Admin configures unverified user reminder sequence: email timing, content, stop conditions
48. Admin configures verified but no deposit sequence: email timing, topics, attached promotions, stop conditions
49. Admin configures deposit but no contract sequence: email content, stop conditions
50. Admin configures abandoned purchase sequence: email timing, recovery content, stop conditions
51. Admin enables/disables sequences
52. Admin views sequence performance: completion rate, time to target action, drop-off points, revenue
53. Admin accesses Campaign Manager
54. Admin creates new campaign: name, type, email template, target audience, schedule
55. Admin selects campaign type: Welcome, Educational, Promotional, Seasonal, Product Launch, Newsletter, Feature Announcement
56. Admin defines target audience with segmentation filters
57. Admin attaches promotions or discount codes to campaign
58. Admin previews campaign and sends test email
59. Admin schedules campaign or sends immediately
60. Admin saves campaign as draft
61. Admin pauses active campaign
62. Admin resumes paused campaign
63. Admin duplicates campaign
64. Admin archives campaign
65. Admin views campaign analytics: delivered, opened, clicked, converted, open rate, CTR, conversion rate, revenue
66. Admin accesses Audience Segmentation
67. Admin creates custom segment with filters: Country, Registration Date, Total Deposits, Total Hashrate, Contract Type, Preferred Coin, Last Activity Date, Email Engagement Level, Referral Status
68. Admin views segment size in real-time
69. Admin saves segment for reuse
70. Admin exports segment to CSV
71. Admin applies segment to campaign
72. Admin accesses Marketing Email Templates
73. Admin views templates organized by category: Welcome, Verify Email Reminder, Getting Started, No Deposit Yet, No Contract Yet, Abandoned Purchase, Promotional Offers
74. Admin edits template subject and HTML body
75. Admin inserts dynamic variables into template
76. Admin previews template with sample data
77. Admin sends test email
78. Admin duplicates template
79. Admin restores template to default
80. Admin accesses Promotion & Discount Engine
81. Admin creates promotion: name, type, value, start date, end date, max redemptions, eligible users, applicable contracts, min purchase requirements
82. Admin selects promotion type: Percentage Discount, Fixed Discount, Bonus Hashpower, Maintenance Fee Discount, Coupon Code, Limited-Time Campaign
83. Admin generates coupon code
84. Admin configures auto-apply rules
85. Admin activates promotion
86. Admin views promotion performance: redemptions, revenue, discount given, average order value, ROI
87. User enters contract purchase flow and system applies valid promotions automatically at checkout
88. User enters coupon code at checkout and system validates and applies discount
89. System displays applied discount amount and final price
90. System enforces promotion usage limits per user and total redemptions
91. Admin accesses Abandoned Purchase Tracker
92. Admin views abandoned purchases list: user email, contract name, hashrate, price, abandonment date, stage, status
93. Admin filters by date range, contract type, stage, status
94. Admin sends manual recovery email
95. Admin applies special discount to abandoned purchase
96. Admin views recovery email history
97. Admin accesses Marketing Analytics Dashboard
98. Admin views conversion funnel metrics: Visitor to Lead, Lead to Registered, Registered to Verified, Verified to Deposit, Deposit to Contract, Contract to Repeat Customer
99. Admin views popup performance: impressions, conversion rate, email captures, dismissal rate
100. Admin views campaign performance: open rate, CTR, conversion rate, revenue by campaign
101. Admin views sequence performance: completion rate, time to action, drop-off points, revenue
102. Admin views promotion performance: redemptions, revenue, discount given, ROI
103. Admin views charts: Conversion Funnel, Daily Email Captures, Campaign Performance, Sequence Effectiveness, Promotion Usage Trends, Revenue by Marketing Channel
104. Admin compares provider performance
105. Admin identifies best performing email templates
106. Admin accesses Compliance & Consent Management
107. Admin views consent tracking records: email, consent timestamp, opt-in status, source
108. Admin enables/disables double opt-in requirement
109. Admin configures confirmation email template
110. Admin views unsubscribed users list with unsubscribe reason and timestamp
111. Admin generates consent audit report
112. Admin generates unsubscribe report
113. Admin exports compliance data
114. User accesses Email Preferences in account settings
115. User views current email subscription status
116. User opts in or opts out of marketing email categories: Marketing Emails, Educational Content, Promotional Offers, Product Updates, Newsletter
117. User unsubscribes from all marketing emails
118. User views email subscription history
119. System respects user email preferences and never sends marketing emails to opted-out users
120. System always delivers transactional emails regardless of user preferences

## 7. Out of Scope for Current Release

(All existing out of scope items from original PRD remain unchanged)

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
- Advanced email personalization based on user behavior beyond basic segmentation
- Email marketing automation workflows beyond defined sequences
- Drip email campaigns beyond defined sequences
- Email list segmentation beyond defined filters
- Email deliverability scoring
- Email spam testing tools
- Email template marketplace
- Third-party email template integrations
- Advanced email analytics (heatmaps, engagement scoring)
- Email forwarding and aliasing
- Email archiving and compliance features beyond consent tracking
- Email encryption (PGP/S/MIME)
- Email signature management
- Email scheduling for individual users
- Email reminders and follow-ups beyond defined sequences
- Email collaboration features
- Email approval workflows
- Email versioning and rollback
- Email localization beyond basic timezone support
- Email accessibility features (screen reader optimization)
- Email dark mode testing tools
- Email client compatibility testing
- Email rendering preview across devices
- Email link tracking with UTM parameters
- Email conversion tracking beyond basic conversion attribution
- Email revenue attribution beyond campaign-level tracking
- Email ROI calculation beyond promotion-level tracking
- Email sentiment analysis
- Email feedback collection
- Email survey integration
- Email social sharing features
- Email referral tracking beyond basic referral user segmentation
- Email loyalty program integration
- AI-powered email content generation
- Predictive send time optimization
- Dynamic content personalization beyond basic variables
- Behavioral trigger emails beyond defined sequences
- Multi-channel marketing automation (SMS, push notifications, in-app messages)
- Marketing attribution modeling
- Customer lifetime value prediction
- Churn prediction and prevention
- Lead scoring algorithms
- Progressive profiling
- Account-based marketing features
- Marketing automation integrations with third-party platforms
- Advanced funnel visualization and optimization tools
- Multivariate testing for campaigns
- Real-time personalization engine
- Cross-device tracking and attribution
- Marketing data warehouse integration
- Custom reporting and dashboard builder
- Marketing automation API for external integrations