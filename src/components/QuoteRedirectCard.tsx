import { FileText, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ChatMode } from "@/components/ModeSelector";

interface QuoteRedirectCardProps {
  onEscapeToSpecs: () => void;
  onEscapeToLearn: () => void;
}

const QuoteRedirectCard = ({ onEscapeToSpecs, onEscapeToLearn }: QuoteRedirectCardProps) => {
  const navigate = useNavigate();
  const handleStartQuote = () => {
    navigate("/quote");
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-primary/10">
            <FileText className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 space-y-3">
            <div>
              <h3 className="font-semibold text-foreground">Ready for a quote?</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Submit your project at FastLetter.bot for custom pricing.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button 
                onClick={handleStartQuote}
                size="sm"
                className="gap-1"
              >
                Start Quote
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEscapeToSpecs}
                className="text-muted-foreground hover:text-foreground"
              >
                Ask a spec question instead
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onEscapeToLearn}
                className="text-muted-foreground hover:text-foreground"
              >
                Just learning
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default QuoteRedirectCard;
