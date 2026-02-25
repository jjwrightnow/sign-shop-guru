import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useBranding } from "@/context/BrandingContext";

const Terms = () => {
  const { companyName, supportEmail } = useBranding();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container max-w-3xl mx-auto py-12 px-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Chat
        </Link>

        <h1 className="text-3xl font-bold text-foreground mb-8">
          Terms of Service
        </h1>

        <div className="prose prose-invert max-w-none space-y-6">
          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">1. Acceptance of Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing and using {companyName}, you accept and agree to be bound by the terms
              and provision of this agreement. If you do not agree to abide by the above, please
              do not use this service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">2. Use of Service</h2>
            <p className="text-muted-foreground leading-relaxed">
              {companyName} provides general guidance and information about the sign industry.
              The information provided is for educational purposes only and should not be
              considered professional advice. Always consult with qualified professionals and
              verify information with local authorities before making business decisions.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">3. Disclaimer</h2>
            <p className="text-muted-foreground leading-relaxed">
              The service is provided "as is" without warranties of any kind. We do not
              guarantee the accuracy, completeness, or usefulness of any information provided.
              Any reliance you place on such information is strictly at your own risk.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">4. Code Compliance</h2>
            <p className="text-muted-foreground leading-relaxed">
              {companyName} cannot verify code compliance for electrical, structural, or zoning
              requirements. All code-related decisions must be verified by licensed professionals
              and approved by your local Authority Having Jurisdiction (AHJ).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">5. Privacy & Data Collection</h2>
            <p className="text-muted-foreground leading-relaxed">
              We collect and store information you provide to personalize your experience.
              Your data is used solely to improve our service and will not be sold to third
              parties. Conversations may be reviewed to improve AI responses.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">6. Communication Policy</h2>
            <p className="text-muted-foreground leading-relaxed">
              <strong className="text-foreground">Email-Only Communication:</strong> {companyName}{" "}
              communicates exclusively via email. We will never ask for your phone number, and we 
              will never call you. All communications are conducted in writing to prevent 
              misunderstandings and to ensure clear context with documented history and 
              illustrations whenever possible.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-3">
              For all inquiries, please contact us at{" "}
              <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
                {supportEmail}
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">7. Changes to Terms</h2>
            <p className="text-muted-foreground leading-relaxed">
              We reserve the right to modify these terms at any time. Continued use of the
              service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-foreground mb-3">8. Contact</h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these terms, please email us at{" "}
              <a href={`mailto:${supportEmail}`} className="text-primary hover:underline">
                {supportEmail}
              </a>
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-border">
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Terms;