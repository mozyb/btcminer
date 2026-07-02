import type { ReactNode } from 'react';

// Public pages
import HomePage from './pages/public/HomePage';
import AboutPage from './pages/public/AboutPage';
import MarketplacePage from './pages/public/MarketplacePage';
import FarmsPage from './pages/public/FarmsPage';
import HardwarePage from './pages/public/HardwarePage';
import CalculatorPage from './pages/public/CalculatorPage';
import PricingPage from './pages/public/PricingPage';
import AffiliateProgramPage from './pages/public/AffiliateProgramPage';
import BlogPage from './pages/public/BlogPage';
import BlogArticlePage from './pages/public/BlogArticlePage';
import FAQPage from './pages/public/FAQPage';
import ContactPage from './pages/public/ContactPage';
import TransparencyPage from './pages/public/TransparencyPage';
import PolicyPage from './pages/public/PolicyPage';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import EmailVerificationPage from './pages/auth/EmailVerificationPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';

// User Dashboard
import DashboardOverview from './pages/dashboard/DashboardOverview';
import ContractsPage from './pages/dashboard/ContractsPage';
import DashboardMarketplace from './pages/dashboard/DashboardMarketplace';
import AnalyticsPage from './pages/dashboard/AnalyticsPage';
import WalletPage from './pages/dashboard/WalletPage';
import DepositPage from './pages/dashboard/DepositPage';
import WithdrawPage from './pages/dashboard/WithdrawPage';
import TransactionsPage from './pages/dashboard/TransactionsPage';
import AffiliatePage from './pages/dashboard/AffiliatePage';
import KYCPage from './pages/dashboard/KYCPage';
import SupportPage from './pages/dashboard/SupportPage';
import NotificationsPage from './pages/dashboard/NotificationsPage';
import AccountSettingsPage from './pages/dashboard/AccountSettingsPage';
import SecuritySettingsPage from './pages/dashboard/SecuritySettingsPage';

// Admin Dashboard
import AdminOverview from './pages/admin/AdminOverview';
import AdminUsers from './pages/admin/AdminUsers';
import AdminContracts from './pages/admin/AdminContracts';
import AdminFarms from './pages/admin/AdminFarms';
import AdminHardware from './pages/admin/AdminHardware';
import AdminWallets from './pages/admin/AdminWallets';
import AdminDeposits from './pages/admin/AdminDeposits';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminAPIs from './pages/admin/AdminAPIs';
import AdminAffiliate from './pages/admin/AdminAffiliate';
import AdminKYC from './pages/admin/AdminKYC';
import AdminSupport from './pages/admin/AdminSupport';
import AdminCMS from './pages/admin/AdminCMS';
import AdminSEO from './pages/admin/AdminSEO';
import AdminRoles from './pages/admin/AdminRoles';
import AdminNotifications from './pages/admin/AdminNotifications';
import AdminAuditLogs from './pages/admin/AdminAuditLogs';
import AdminPaymentMethods from './pages/admin/AdminPaymentMethods';
import AdminSettings from './pages/admin/AdminSettings';
import AdminUserPortal from './pages/admin/AdminUserPortal';
import AdminRewardJobs from './pages/admin/AdminRewardJobs';
import AdminReviews from './pages/admin/AdminReviews';
import AdminFAQ from './pages/admin/AdminFAQ';
import AdminBlog from './pages/admin/AdminBlog';
import AdminPayoutProofs from './pages/admin/AdminPayoutProofs';
import AdminPlatformStats from './pages/admin/AdminPlatformStats';
import AdminMarketplace from './pages/admin/AdminMarketplace';
import AdminCalculator from './pages/admin/AdminCalculator';
import AdminEmailProviders from './pages/admin/AdminEmailProviders';
import AdminEmailTemplates from './pages/admin/AdminEmailTemplates';
import AdminEmailQueue from './pages/admin/AdminEmailQueue';
import AdminEmailLogs from './pages/admin/AdminEmailLogs';
import AdminEmailAnalytics from './pages/admin/AdminEmailAnalytics';
import AdminNewsletterCampaigns from './pages/admin/AdminNewsletterCampaigns';
import AdminEmailTestCenter from './pages/admin/AdminEmailTestCenter';
import AdminEmailSettings from './pages/admin/AdminEmailSettings';
import ContractDetailPage from './pages/public/ContractDetailPage';
import CalculatorVariantPage from './pages/public/CalculatorVariantPage';
import RewardsPage from './pages/dashboard/RewardsPage';

export interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  public?: boolean;
}

export const routes: RouteConfig[] = [
  // Public
  { name: 'Home', path: '/', element: <HomePage />, public: true },
  { name: 'About', path: '/about', element: <AboutPage />, public: true },
  { name: 'Marketplace', path: '/marketplace', element: <MarketplacePage />, public: true },
  { name: 'Contract Detail', path: '/marketplace/:slug', element: <ContractDetailPage />, public: true },
  { name: 'Farms', path: '/farms', element: <FarmsPage />, public: true },
  { name: 'Hardware', path: '/hardware', element: <HardwarePage />, public: true },
  { name: 'Calculator', path: '/calculator', element: <CalculatorPage />, public: true },
  { name: 'Pricing', path: '/pricing', element: <PricingPage />, public: true },
  { name: 'Affiliate Program', path: '/affiliate-program', element: <AffiliateProgramPage />, public: true },
  { name: 'Blog', path: '/blog', element: <BlogPage />, public: true },
  { name: 'Blog Article', path: '/blog/:slug', element: <BlogArticlePage />, public: true },
  { name: 'FAQ', path: '/faq', element: <FAQPage />, public: true },
  { name: 'Contact', path: '/contact', element: <ContactPage />, public: true },
  { name: 'Transparency', path: '/transparency', element: <TransparencyPage />, public: true },
  { name: 'Terms', path: '/terms', element: <PolicyPage type="terms" />, public: true },
  { name: 'Privacy', path: '/privacy', element: <PolicyPage type="privacy" />, public: true },
  { name: 'AML Policy', path: '/aml', element: <PolicyPage type="aml" />, public: true },
  { name: 'KYC Policy', path: '/kyc-policy', element: <PolicyPage type="kyc" />, public: true },
  { name: 'Risk Disclosure', path: '/risk', element: <PolicyPage type="risk" />, public: true },
  // Auth
  { name: 'Login', path: '/login', element: <LoginPage />, public: true },
  { name: 'Register', path: '/register', element: <RegisterPage />, public: true },
  { name: 'Verify Email', path: '/verify-email', element: <EmailVerificationPage />, public: true },
  { name: 'Forgot Password', path: '/forgot-password', element: <ForgotPasswordPage />, public: true },
  { name: 'Reset Password', path: '/reset-password', element: <ResetPasswordPage />, public: true },
  // User Dashboard
  { name: 'Dashboard', path: '/dashboard', element: <DashboardOverview /> },
  { name: 'Contracts', path: '/dashboard/contracts', element: <ContractsPage /> },
  { name: 'Marketplace', path: '/dashboard/marketplace', element: <DashboardMarketplace /> },
  { name: 'Analytics', path: '/dashboard/analytics', element: <AnalyticsPage /> },
  { name: 'My Rewards', path: '/dashboard/rewards', element: <RewardsPage /> },
  { name: 'Wallet', path: '/dashboard/wallet', element: <WalletPage /> },
  { name: 'Deposit', path: '/dashboard/deposit', element: <DepositPage /> },
  { name: 'Withdraw', path: '/dashboard/withdraw', element: <WithdrawPage /> },
  { name: 'Transactions', path: '/dashboard/transactions', element: <TransactionsPage /> },
  { name: 'Affiliate', path: '/dashboard/affiliate', element: <AffiliatePage /> },
  { name: 'KYC', path: '/dashboard/kyc', element: <KYCPage /> },
  { name: 'Support', path: '/dashboard/support', element: <SupportPage /> },
  { name: 'Notifications', path: '/dashboard/notifications', element: <NotificationsPage /> },
  { name: 'Account Settings', path: '/dashboard/settings', element: <AccountSettingsPage /> },
  { name: 'Security Settings', path: '/dashboard/security', element: <SecuritySettingsPage /> },
  // Admin
  { name: 'Admin Overview', path: '/admin', element: <AdminOverview /> },
  { name: 'Admin Users', path: '/admin/users', element: <AdminUsers /> },
  { name: 'Admin User Portal', path: '/admin/user-portal', element: <AdminUserPortal /> },
  { name: 'Admin Contracts', path: '/admin/contracts', element: <AdminContracts /> },
  { name: 'Admin Farms', path: '/admin/farms', element: <AdminFarms /> },
  { name: 'Admin Hardware', path: '/admin/hardware', element: <AdminHardware /> },
  { name: 'Admin Wallets', path: '/admin/wallets', element: <AdminWallets /> },
  { name: 'Admin Deposits', path: '/admin/deposits', element: <AdminDeposits /> },
  { name: 'Admin Withdrawals', path: '/admin/withdrawals', element: <AdminWithdrawals /> },
  { name: 'Admin Payment Methods', path: '/admin/payment-methods', element: <AdminPaymentMethods /> },
  { name: 'Admin APIs', path: '/admin/apis', element: <AdminAPIs /> },
  { name: 'Admin Affiliate', path: '/admin/affiliate', element: <AdminAffiliate /> },
  { name: 'Admin KYC', path: '/admin/kyc', element: <AdminKYC /> },
  { name: 'Admin Support', path: '/admin/support', element: <AdminSupport /> },
  { name: 'Admin CMS', path: '/admin/cms', element: <AdminCMS /> },
  { name: 'Admin SEO', path: '/admin/seo', element: <AdminSEO /> },
  { name: 'Admin Roles', path: '/admin/roles', element: <AdminRoles /> },
  { name: 'Admin Notifications', path: '/admin/notifications', element: <AdminNotifications /> },
  { name: 'Admin Audit Logs', path: '/admin/audit', element: <AdminAuditLogs /> },
  { name: 'Admin Settings', path: '/admin/settings', element: <AdminSettings /> },
  { name: 'Admin Reward Jobs', path: '/admin/reward-jobs', element: <AdminRewardJobs /> },
  { name: 'Admin Reviews', path: '/admin/reviews', element: <AdminReviews /> },
  { name: 'Admin FAQ', path: '/admin/faq', element: <AdminFAQ /> },
  { name: 'Admin Blog', path: '/admin/blog', element: <AdminBlog /> },
  { name: 'Admin Payout Proofs', path: '/admin/payout-proofs', element: <AdminPayoutProofs /> },
  { name: 'Admin Platform Stats', path: '/admin/platform-stats', element: <AdminPlatformStats /> },
  { name: 'Admin Marketplace Content', path: '/admin/marketplace', element: <AdminMarketplace /> },
  { name: 'Admin Calculator Content', path: '/admin/calculator', element: <AdminCalculator /> },
  // Admin Email Management Center
  { name: 'Admin Email Providers', path: '/admin/email/providers', element: <AdminEmailProviders /> },
  { name: 'Admin Email Templates', path: '/admin/email/templates', element: <AdminEmailTemplates /> },
  { name: 'Admin Email Queue', path: '/admin/email/queue', element: <AdminEmailQueue /> },
  { name: 'Admin Email Logs', path: '/admin/email/logs', element: <AdminEmailLogs /> },
  { name: 'Admin Email Analytics', path: '/admin/email/analytics', element: <AdminEmailAnalytics /> },
  { name: 'Admin Newsletter Campaigns', path: '/admin/email/campaigns', element: <AdminNewsletterCampaigns /> },
  { name: 'Admin Email Test Center', path: '/admin/email/test', element: <AdminEmailTestCenter /> },
  { name: 'Admin Email Settings', path: '/admin/email/settings', element: <AdminEmailSettings /> },
  // Calculator variation pages
  { name: 'Bitcoin Mining Calculator',  path: '/bitcoin-mining-calculator',  element: <CalculatorVariantPage variant="bitcoin-mining-calculator" />,  public: true },
  { name: 'ASIC Mining Calculator',     path: '/asic-mining-calculator',     element: <CalculatorVariantPage variant="asic-mining-calculator" />,     public: true },
  { name: 'SHA-256 Mining Calculator',  path: '/sha256-mining-calculator',   element: <CalculatorVariantPage variant="sha256-mining-calculator" />,   public: true },
  { name: 'Mining Profit Calculator',   path: '/mining-profit-calculator',   element: <CalculatorVariantPage variant="mining-profit-calculator" />,   public: true },
  { name: 'Cloud Mining Calculator',    path: '/cloud-mining-calculator',    element: <CalculatorVariantPage variant="cloud-mining-calculator" />,    public: true },
];
