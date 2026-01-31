import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy - Mökki",
  description: "Privacy Policy for the Mökki mobile app",
};

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen flex flex-col">
      <div className="geometric-bg" aria-hidden="true" />

      <div className="relative z-10 flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 md:py-12">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Mökki
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold font-chillax mb-2">Privacy Policy</h1>
            <p className="text-muted-foreground">Last Updated: January 30, 2026</p>
          </div>

          {/* Content */}
          <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border p-6 md:p-8 space-y-8">

            {/* Introduction */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Mökki (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;). This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application.
              </p>
              <p className="text-muted-foreground leading-relaxed mt-3">
                Please read this privacy policy carefully. If you do not agree with the terms of this privacy policy, please do not access the application.
              </p>
              <div className="mt-4 p-4 bg-secondary/50 rounded-lg">
                <p className="text-sm"><strong>Contact:</strong> mattkettelkamp@gmail.com</p>
                <p className="text-sm"><strong>Website:</strong> mokkiski.com</p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Information We Collect</h2>

              <h3 className="font-medium mt-4 mb-2">Account Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Email address</strong> — Used for authentication and account recovery</li>
                <li><strong>Password</strong> — Stored securely using industry-standard encryption</li>
              </ul>

              <h3 className="font-medium mt-4 mb-2">Profile Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Display name</strong> — How you appear to other house members</li>
                <li><strong>Profile photo</strong> — Avatar image for your account</li>
                <li><strong>Venmo handle</strong> — For manual payment coordination between house members</li>
                <li><strong>Rider type</strong> — Optional skiing/snowboarding preference</li>
                <li><strong>Tagline</strong> — Optional personal description</li>
              </ul>

              <h3 className="font-medium mt-4 mb-2">User-Generated Content</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Chat messages</strong> — Text messages up to 2,000 characters</li>
                <li><strong>Media attachments</strong> — Photos (up to 10MB) and videos (up to 100MB)</li>
                <li><strong>B-Roll content</strong> — Shared photos and videos with captions</li>
                <li><strong>Expenses</strong> — Amounts, categories, descriptions, and receipt images</li>
                <li><strong>Bulletin posts</strong> — Notes and announcements</li>
                <li><strong>Events and itineraries</strong> — Trip planning information</li>
              </ul>

              <h3 className="font-medium mt-4 mb-2">Device and Technical Information</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Push notification tokens</strong> — To send you notifications</li>
                <li><strong>Device identifier</strong> — For device-specific functionality</li>
                <li><strong>Platform information</strong> — iOS, Android, or Web</li>
                <li><strong>Timestamps</strong> — When content is created or modified</li>
                <li><strong>Read receipts</strong> — For chat message delivery status</li>
              </ul>

              <h3 className="font-medium mt-4 mb-2">Biometric Data</h3>
              <p className="text-muted-foreground">
                If you enable biometric authentication (Face ID or Touch ID), biometric data is <strong>stored locally on your device only</strong>. We never transmit or store biometric data on our servers.
              </p>
            </section>

            {/* What We Don't Collect */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Information We Do NOT Collect</h2>
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>Location/GPS data</strong> — We only use preset resort coordinates for weather</li>
                  <li><strong>Payment card information</strong> — Venmo handles are stored for reference only</li>
                  <li><strong>Contacts or address book</strong> — We never access your contacts</li>
                  <li><strong>Browsing history</strong> — We don&apos;t track your browsing</li>
                  <li><strong>Advertising identifiers</strong> — We don&apos;t use advertising SDKs</li>
                  <li><strong>Analytics tracking</strong> — We don&apos;t use third-party analytics services</li>
                </ul>
              </div>
            </section>

            {/* How We Use Information */}
            <section>
              <h2 className="text-xl font-semibold mb-3">How We Use Your Information</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Provide and maintain</strong> the Mökki service</li>
                <li><strong>Enable house features</strong> — Chat, expenses, bulletin, events, and B-Roll sharing</li>
                <li><strong>Send notifications</strong> — Trip updates, new messages, and expense alerts</li>
                <li><strong>Process expense tracking</strong> — Calculate splits and balances between house members</li>
                <li><strong>Display weather information</strong> — Using resort coordinates (not your location)</li>
                <li><strong>Authenticate your account</strong> — Verify your identity and secure access</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Information Sharing</h2>

              <h3 className="font-medium mt-4 mb-2">With House Members</h3>
              <p className="text-muted-foreground">
                When you join a house, other members can see your display name, profile photo, chat messages, expenses you create, B-Roll content you share, and events/bulletin posts you create.
              </p>

              <h3 className="font-medium mt-4 mb-2">With Service Providers</h3>
              <div className="overflow-x-auto mt-2">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4">Service</th>
                      <th className="text-left py-2 pr-4">Purpose</th>
                      <th className="text-left py-2">Data Shared</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">Supabase</td>
                      <td className="py-2 pr-4">Database & auth</td>
                      <td className="py-2">Account data, user content</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4 font-medium">Expo</td>
                      <td className="py-2 pr-4">Push notifications</td>
                      <td className="py-2">Push tokens, device IDs</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4 font-medium">Open-Meteo</td>
                      <td className="py-2 pr-4">Weather forecasts</td>
                      <td className="py-2">Resort coordinates only</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <h3 className="font-medium mt-4 mb-2">What We Never Do</h3>
              <div className="bg-primary/5 border border-primary/10 rounded-lg p-4">
                <ul className="list-disc list-inside text-muted-foreground space-y-1">
                  <li><strong>We do not sell your personal information</strong></li>
                  <li><strong>We do not share data with advertising networks</strong></li>
                  <li><strong>We do not use your data for targeted advertising</strong></li>
                </ul>
              </div>
            </section>

            {/* Data Storage & Security */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Data Storage and Security</h2>
              <p className="text-muted-foreground mb-3">
                Your data is stored on Supabase cloud infrastructure. We implement appropriate security measures including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>HTTPS/TLS encryption for all data transmission</li>
                <li>Secure token storage for authentication</li>
                <li>Row-level security in our database</li>
                <li>Encrypted password storage using industry-standard hashing</li>
              </ul>
            </section>

            {/* Your Rights */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Your Rights</h2>

              <h3 className="font-medium mt-4 mb-2">For All Users</h3>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Access</strong> your personal data</li>
                <li><strong>Correct</strong> inaccurate information</li>
                <li><strong>Delete</strong> your account and associated data</li>
                <li><strong>Export</strong> your data</li>
                <li><strong>Opt-out</strong> of push notifications at any time</li>
              </ul>

              <h3 className="font-medium mt-4 mb-2">For European Union Residents (GDPR)</h3>
              <p className="text-muted-foreground mb-2">If you are in the EU, you also have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Data portability — Receive your data in a structured format</li>
                <li>Restrict processing — Limit how we use your data</li>
                <li>Object to processing — Object to certain uses of your data</li>
                <li>Withdraw consent — Withdraw previously given consent</li>
                <li>Lodge a complaint — File a complaint with a supervisory authority</li>
              </ul>

              <h3 className="font-medium mt-4 mb-2">For California Residents (CCPA/CPRA)</h3>
              <p className="text-muted-foreground mb-2">If you are a California resident, you have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Know</strong> what personal information we collect and how it&apos;s used</li>
                <li><strong>Delete</strong> your personal information</li>
                <li><strong>Opt-out</strong> of the sale of personal information (we do not sell your data)</li>
                <li><strong>Non-discrimination</strong> — Exercise your rights without penalty</li>
              </ul>
              <p className="text-muted-foreground mt-3">
                <strong>Categories of Personal Information Collected:</strong> Identifiers (email, display name), Internet or network activity (device info, platform), User-generated content (messages, photos, expenses).
              </p>
              <p className="text-muted-foreground mt-2">
                <strong>We do not sell personal information.</strong> We have not sold personal information in the preceding 12 months.
              </p>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Data Retention</h2>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li><strong>Account data</strong> — Retained until you delete your account</li>
                <li><strong>Messages and content</strong> — Retained until manually deleted by users or house deletion</li>
                <li><strong>Push tokens</strong> — Retained until you unregister from notifications or delete your account</li>
                <li><strong>Expense records</strong> — Retained until the associated house is deleted</li>
              </ul>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Children&apos;s Privacy</h2>
              <p className="text-muted-foreground">
                Mökki is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us at mattkettelkamp@gmail.com, and we will delete such information.
              </p>
            </section>

            {/* International Transfers */}
            <section>
              <h2 className="text-xl font-semibold mb-3">International Data Transfers</h2>
              <p className="text-muted-foreground">
                Your information may be transferred to and processed in countries other than your country of residence, including the United States where Supabase infrastructure may be located. If you are located in the European Economic Area (EEA), we ensure appropriate safeguards are in place for international transfers, including standard contractual clauses approved by the European Commission.
              </p>
            </section>

            {/* Changes */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Changes to This Policy</h2>
              <p className="text-muted-foreground">
                We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the new Privacy Policy on this page, updating the &quot;Last Updated&quot; date, and sending a notification through the app for significant changes.
              </p>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Contact Us</h2>
              <p className="text-muted-foreground mb-4">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us:
              </p>
              <div className="p-4 bg-secondary/50 rounded-lg">
                <p className="font-medium">Email: mattkettelkamp@gmail.com</p>
                <p className="text-sm text-muted-foreground mt-1">
                  For data protection inquiries, include &quot;Privacy Request&quot; in your subject line.
                </p>
              </div>
            </section>

            {/* Summary Table */}
            <section>
              <h2 className="text-xl font-semibold mb-3">Summary</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left py-2 pr-4">What We Collect</th>
                      <th className="text-left py-2 pr-4">Why</th>
                      <th className="text-left py-2">Your Control</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">Email & password</td>
                      <td className="py-2 pr-4">Account authentication</td>
                      <td className="py-2">Delete account anytime</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">Display name & photo</td>
                      <td className="py-2 pr-4">Identify you to members</td>
                      <td className="py-2">Edit or remove anytime</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">Messages & media</td>
                      <td className="py-2 pr-4">House communication</td>
                      <td className="py-2">Delete individual items</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">Expenses</td>
                      <td className="py-2 pr-4">Track shared costs</td>
                      <td className="py-2">Delete your entries</td>
                    </tr>
                    <tr className="border-b border-border/50">
                      <td className="py-2 pr-4">Push tokens</td>
                      <td className="py-2 pr-4">Send notifications</td>
                      <td className="py-2">Disable in device settings</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-4">Device info</td>
                      <td className="py-2 pr-4">App functionality</td>
                      <td className="py-2">Part of using the app</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-green-500/10 border border-green-500/20 rounded-lg text-sm">
                <p><strong>We don&apos;t collect:</strong> Location, contacts, payment cards, browsing history, or advertising data.</p>
                <p className="mt-1"><strong>We don&apos;t sell:</strong> Your personal information to anyone.</p>
              </div>
            </section>

            {/* Effective Date */}
            <div className="pt-4 border-t border-border text-center text-sm text-muted-foreground">
              This privacy policy is effective as of January 30, 2026.
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-foreground transition-colors">
              mokkiski.com
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
