# Requirements Document

## 1. Application Overview

### 1.1 Application Name
BTCMiner.online

### 1.2 Application Description
A cloud mining and hashrate marketplace platform featuring integrated email management, marketing automation, lead capture, platform-aligned mining calculators tied directly to platform contract plans, and administrative controls including user account impersonation, direct contract assignment capabilities, and streamlined zero-fee wallet withdrawal operations with a $5 minimum threshold.

## 2. Users and Usage Scenarios

### 2.1 Target Users
- Individual miners and cryptocurrency enthusiasts purchasing hashrate contracts, estimating earnings using platform mining calculators, and managing earnings withdrawals
- Platform administrators managing operations, contract allocations, email systems, withdrawal processing, and marketing campaigns
- Support staff assisting users with account management and troubleshooting

### 2.2 Core Usage Scenarios
- Visitors explore hashrate plans, calculate potential returns aligned with actual platform mining plans via the mining calculator, interact with promotional popups, and register accounts
- Registered users purchase mining contracts, track mining analytics, simulate earnings across platform plans, deposit funds, and withdraw earnings with zero fees (minimum withdrawal amount of $5)
- Eligible users purchase the introductory \"Starter SHA-256\" plan once per account, after which the plan becomes permanently unavailable for repeat purchase
- Administrators impersonate standard user accounts to inspect dashboard views and troubleshoot issues directly
- Administrators assign or purchase mining contracts directly for specific users via administrative grant or by deducting user wallet balance
- Administrators review and manage zero-fee withdrawal requests meeting the $5 minimum threshold

## 3. Page Structure and Functional Description

### 3.1 Page Structure

```
BTCMiner.online Platform
├── Public Website
│   ├── Homepage (with Smart Promotional Popup)
│   ├── Mining Marketplace
│   ├── Mining Calculator (Aligned with Platform Mining Plans)
│   ├── Pricing
│   └── Informational Pages (About Us, FAQ, Contact, Policies)
├── Authentication Pages
│   ├── Registration
│   ├── Login
│   ├── Email Verification
│   ├── Forgot Password
│   └── Reset Password
├── User Dashboard
│   ├── Impersonation Banner (Visible during admin impersonation session)
│   ├── Dashboard Overview
│   ├── My Mining Contracts
│   ├── Hashrate Marketplace (with Starter SHA-256 eligibility indicator)
│   ├── Mining Calculator / Earnings Estimator
│   ├── Mining Analytics
│   ├── Wallet & Transactions (Deposit & Withdrawal)
│   │   ├── Deposit Section
│   │   ├── Withdrawal Section (Min $5, Zero Fee display)
│   │   └── Transaction History
│   ├── Account & Security Settings
│   └── Email Preferences
└── Admin Dashboard
    ├── Admin Overview
    ├── User Management
    │   ├── User List & Search
    │   ├── User Details View
    │   ├── Impersonate User Action
    │   └── Assign/Buy Contract Modal
    ├── Contract Management
    │   ├── Contract List & Creation (Plan Parameters & Calculator Yield Config)
    │   ├── Active Contracts Overview
    │   └── Direct Contract Allocation Tool
    ├── Wallet, Deposit & Withdrawal Management
    │   ├── Deposit & Withdrawal Records
    │   └── Withdrawal Processing & Threshold Settings ($5 Minimum, $0 Fee default)
    ├── Audit Logs & System Settings
    ├── Email Management Center
    │   ├── Email Provider & Template Management
    │   ├── Email Queue & Delivery Logs
    │   └── Newsletter Campaign Manager
    └── Marketing Automation Center
        ├── Smart Popup Manager
        ├── Lead Capture Management
        ├── Automation Sequence Manager
        └── Promotion & Discount Engine
```

### 3.2 Public Website

#### 3.2.1 Smart Promotional Popup
- Display Triggers: Triggered by elapsed time (20-30 seconds), scroll depth (50%), exit intent, or multiple page visits
- Display Suppression: Suppressed for authenticated users, users with completed purchases, or users within the dismissal cooldown period
- Content & Actions: Title, description, promotional asset, lead capture input form (email address), CTA button, and close action

#### 3.2.2 Mining Marketplace & Pricing
- Displays available hashrate packages, including standard recurring/tiered contracts and introductory packages
- Highlights the \"Starter SHA-256\" introductory package with clear designation as a 1-time purchase per account

#### 3.2.3 Mining Calculator
- Provides interactive calculation based strictly on the platform's active mining plans
- Allows users to select or switch between specific platform plans (e.g., Starter SHA-256, tiered SHA-256 packages) or adjust hashrate within supported plan tiers
- Displays calculated estimates based on plan-specific parameters including contract duration, plan cost, expected daily/monthly/total estimated return, and net profit projections derived directly from active platform contract configurations
- Includes a direct \"Buy Plan\" / \"Get Started\" action linking selected calculation results to the corresponding plan in the marketplace

### 3.3 Authentication System
- Registration: Standard account registration with email and password
- Login: Email and password authentication
- Email Verification: Verification token confirmation via email
- Password Reset: Password recovery workflow via reset token

### 3.4 User Dashboard

#### 3.4.1 Impersonation Banner
- Omnipresent banner shown at the top of all user pages exclusively when an administrator is actively impersonating the account
- Displays target user identity and a control button to immediately terminate impersonation and return to the Admin Dashboard

#### 3.4.2 Core User Pages
- Dashboard Overview: Summary of active hashrate, earnings, and account status
- My Mining Contracts: List of active, expired, and administratively assigned contracts
- Hashrate Marketplace:
  - Lists all available mining contract packages
  - For accounts that have never purchased or received the \"Starter SHA-256\" plan, the plan is available for purchase
  - For accounts that have already purchased or received the \"Starter SHA-256\" plan, the plan card/button is permanently disabled with a clear UI status indicator (e.g., \"Already Claimed\" / \"Purchased\") and the purchase flow is blocked
- Mining Calculator / Earnings Estimator:
  - In-dashboard calculator operating strictly under platform mining plan parameters
  - Reflects user-specific eligibility (e.g., indicating single-purchase status for Starter SHA-256)
  - Calculates expected daily, weekly, and contract-term yields according to active platform contract offerings
- Wallet & Transactions:
  - Balance overview displaying available, pending, and total funds
  - Deposit interface with supported deposit methods
  - Withdrawal interface:
    - Prominent UI indicator displaying \"Minimum Withdrawal: $5.00\" and \"Withdrawal Fee: $0.00 (Free)\"
    - Amount input field with real-time validation enforcing the $5 minimum threshold
    - Destination wallet address input
    - Net payout preview calculation confirming $0 deduction for fees (Net Amount = Requested Amount)
    - Submission confirmation
  - Transaction history tracking deposits, withdrawals, contract payments, and status states
- Email Preferences: Opt-in and opt-out controls for promotional email categories

### 3.5 Admin Dashboard

#### 3.5.1 User Management
- User List & Search: Display user records with status, balance, and active contracts
- Impersonate User Action: Trigger button to switch directly into the target user dashboard session without requiring user credentials
- Assign / Buy Contract Modal: Interface to configure a contract type, duration, and hashrate amount, selecting either administrative complimentary grant or deducting from the user wallet balance

#### 3.5.2 Contract Management
- Contract Overview: Manage standard marketplace contract offerings, pricing, hashrate tiers, duration, and daily yield rates used across all platform calculators
- Direct Contract Allocation: Form to select a target user and provision a contract directly

#### 3.5.3 Wallet & Withdrawal Management
- Review, approve, or reject user withdrawal requests
- Withdrawal details view displaying requested amount, destination address, applied fee ($0.00), and final disbursement amount
- System withdrawal settings configured with minimum threshold of $5 and zero withdrawal fee

#### 3.5.4 Email & Marketing Automation Centers
- Email Management: Provider configuration, delivery tracking, and transactional/marketing email templates
- Marketing Automation: Smart popup configuration, lead capture tracking, lifecycle email sequences, and discount code management

## 4. Business Rules and Logic

### 4.1 Platform-Aligned Mining Calculator Logic
- All calculators across the platform (public website, marketplace widgets, user dashboard) must compute estimates strictly based on the configured parameters of platform mining plans
- Calculation Inputs: Plan selection (or hashrate corresponding to available plan tiers), duration, and plan unit pricing configured in platform contract settings
- Calculation Outputs: Estimated daily output, total contract yield, estimated gross revenue, plan cost, and estimated net returns matching official plan terms
- Dynamic Synchronization: When contract plan parameters (e.g., daily reward rate per TH/s, duration, maintenance deduction, price) are modified in Contract Management, all calculator instances update outputs accordingly

### 4.2 \"Starter SHA-256\" Single Purchase Limit
- The \"Starter SHA-256\" mining plan is strictly limited to 1 purchase per user account lifetime
- Eligibility is determined by checking account purchase history and contract allocation records across the platform
- If an account has previously purchased or been administratively assigned a \"Starter SHA-256\" contract:
  1. The plan is marked as disabled/ineligible in the Hashrate Marketplace for that user
  2. Any backend purchase request for this plan from that user account is rejected
  3. The restriction applies permanently regardless of whether the initial contract is currently active or expired

### 4.3 Withdrawal Rules and Fee Structure
- Minimum Withdrawal Amount: Exactly $5.00 (or equivalent cryptocurrency value calculated at standard platform exchange rate). Requests below $5.00 are rejected
- Withdrawal Fee: Exactly $0.00 across all supported withdrawal channels and user tiers. The system deducts zero fee from requested withdrawal amounts
- Net Payout Calculation: `Payout Amount = Requested Withdrawal Amount - $0.00 = Requested Withdrawal Amount`
- Balance Verification: User available balance must be greater than or equal to the requested withdrawal amount (minimum $5.00)

### 4.4 Admin User Impersonation
- Impersonation is restricted to authorized administrative accounts and can only target standard user accounts
- Admin impersonation cannot target other administrator accounts
- Initiating impersonation creates a temporary simulated user session and redirects the admin to the target user dashboard
- The Impersonation Banner remains visible across all pages during the impersonation session
- Terminating the session immediately returns the administrator to the Admin Dashboard User Management page
- All impersonation events (start, actions taken, and exit) are recorded in the platform Audit Logs

### 4.5 Direct Contract Assignment and Purchase by Admin
- Administrators can allocate or purchase contracts for any active standard user account via User Management or Contract Management
- Payment / Allocation Modes:
  1. Administrative Allocation (Complimentary / Override): Provisions contract hashrate without deducting user balance
  2. Admin-Initiated User Purchase: Deducts the required contract cost directly from the target user available wallet balance
- Assigned contracts activate immediately upon confirmation and appear in the user My Mining Contracts section
- If the user balance is insufficient for a paid purchase mode, the operation is blocked and requires using administrative allocation or user balance top-up
- All contract allocations are recorded in the Audit Logs with administrator ID, target user ID, contract details, and timestamp
- An automated email notification is dispatched to the user informing them of the activated contract

### 4.6 Promotional Popups and Marketing Sequences
- Promotional popups capture email leads and automatically trigger relevant welcome and onboarding email sequences
- Automated sequences (e.g., Unverified User, No Deposit, No Contract, Abandoned Purchase) terminate immediately once the target user completes the corresponding goal

## 5. Exception and Boundary Conditions

| Scenario | Handling |
|---|---|
| User selects an inactive or archived mining plan in the calculator | Calculator defaults to the nearest active platform plan and displays an active plan notice |
| User inputs hashrate outside valid platform contract limits | Calculator clamps input to the allowed minimum or maximum tier defined by platform plans |
| User attempts to submit a withdrawal with an amount less than $5.00 | System blocks submission and displays inline validation error: Minimum withdrawal amount is $5.00 |
| User attempts withdrawal exceeding available balance | System blocks submission and displays error: Insufficient available balance |
| User verifies withdrawal fee during checkout/confirmation | Interface displays Fee: $0.00 and Total Deducted equals Requested Amount |
| User attempts to purchase Starter SHA-256 after previously purchasing it | System blocks purchase attempt and displays error: Starter SHA-256 is limited to 1 purchase per account |
| Admin attempts to impersonate another administrator | System blocks action and displays error message: Cannot impersonate administrative accounts |
| Impersonation session expires or admin credentials invalidate | System terminates session and redirects user to admin login |
| Admin attempts paid contract purchase with insufficient user balance | System blocks action and displays error: Insufficient user balance for paid purchase |
| Admin attempts to assign contract to a suspended user account | System blocks action and displays error: Account is suspended or inactive |
| Target user completes contract purchase while No Contract sequence is active | Marketing sequence automatically halts further reminders |
| Visitor submits invalid email format in promotional popup | Inline validation error displays: Invalid email format |

## 6. Acceptance Criteria

1. All mining calculators across the platform (public pages and user dashboard) calculate and display projected earnings, durations, costs, and returns in exact accordance with active platform mining plans.
2. When an administrator updates contract plan pricing, duration, or yield settings, all platform calculators immediately reflect the updated plan values in calculation outputs.
3. On the user wallet withdrawal interface, UI indicators clearly display a minimum withdrawal amount of $5.00 and a withdrawal fee of $0.00.
4. When a user enters a withdrawal amount below $5.00, the system prevents form submission and indicates the $5.00 minimum threshold.
5. When a user submits a valid withdrawal of $5.00 or more with sufficient balance, the platform processes the request with zero fee deduction ($0.00 fee applied).
6. In the admin withdrawal management module, withdrawal requests and system settings reflect the $5.00 minimum rule and $0.00 fee configuration.
7. A new registered user without prior contract history can view, select, and successfully purchase the \"Starter SHA-256\" plan.
8. Once an account has purchased or received a \"Starter SHA-256\" contract, the plan button on the marketplace is disabled with a clear \"Already Claimed\" or \"Purchased\" UI indicator, and repeated purchase requests are blocked.
9. Admin can select an active standard user in User Management and initiate impersonation to view the user dashboard as that user.
10. When impersonating a user, the Impersonation Banner is persistently displayed with an Exit Impersonation action that returns the admin to the Admin Dashboard.
11. Admin can assign a mining contract to a selected user via complimentary administrative grant or via user wallet deduction.
12. Assigned contracts immediately show as active under the user My Mining Contracts page, and impersonation and contract assignment events are recorded in Audit Logs.

## 7. Out of Scope for Current Release

- Third-party CRM automated synchronization
- SMS and mobile push notification delivery
- Real-time screen-sharing or co-browsing during impersonation
- Secondary password authorization requirement for user impersonation
- Tiered withdrawal fee schedules or variable gas-fee surcharges