import { useState, useEffect } from "react";
import { GraduationCap, X, ChevronRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface TrainMePanelProps {
  open: boolean;
  onClose: () => void;
  userId: string;
  onTrainingComplete: () => void;
}

const EQUIPMENT_OPTIONS = [
  { id: "cnc_router", label: "CNC Router" },
  { id: "laser_cutter", label: "Laser Cutter" },
  { id: "channel_letter_bender", label: "Channel Letter Bender" },
  { id: "vinyl_plotter", label: "Vinyl Plotter" },
  { id: "wide_format_printer", label: "Wide Format Printer" },
  { id: "welding_equipment", label: "Welding Equipment" },
  { id: "paint_booth", label: "Paint Booth" },
];

const MATERIALS_OPTIONS = [
  { id: "aluminum_040", label: "Aluminum (.040)" },
  { id: "aluminum_063", label: "Aluminum (.063)" },
  { id: "aluminum_080", label: "Aluminum (.080)" },
  { id: "acrylic_3mm", label: "Acrylic (3mm)" },
  { id: "acrylic_4.5mm", label: "Acrylic (4.5mm)" },
  { id: "acrylic_6mm", label: "Acrylic (6mm)" },
  { id: "polycarbonate", label: "Polycarbonate" },
  { id: "stainless_steel", label: "Stainless Steel" },
  { id: "hdu_foam", label: "HDU/Foam" },
  { id: "pvc_sintra", label: "PVC/Sintra" },
  { id: "acm_dibond", label: "ACM/Dibond" },
];

const PRODUCTS_OPTIONS = [
  { id: "channel_letters_face", label: "Channel Letters (face-lit)" },
  { id: "channel_letters_halo", label: "Channel Letters (halo)" },
  { id: "channel_letters_combo", label: "Channel Letters (combo)" },
  { id: "dimensional_letters", label: "Dimensional Letters" },
  { id: "monument_signs", label: "Monument Signs" },
  { id: "cabinet_lightbox", label: "Cabinet/Lightbox Signs" },
  { id: "pylon_signs", label: "Pylon Signs" },
  { id: "ada_wayfinding", label: "ADA/Wayfinding" },
  { id: "vehicle_wraps", label: "Vehicle Wraps" },
];

const SHOP_TYPE_OPTIONS = [
  { id: "full_service", label: "Full-service" },
  { id: "channel_letters", label: "Channel Letters" },
  { id: "monuments", label: "Monuments" },
  { id: "vinyl_wrap", label: "Vinyl/Wrap" },
  { id: "digital_print", label: "Digital Print" },
  { id: "install_only", label: "Install Only" },
];

const MAX_CONTEXT_ITEMS = 10;
const MAX_CUSTOM_INSTRUCTIONS = 500;

const TrainMePanel = ({ open, onClose, userId, onTrainingComplete }: TrainMePanelProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showUpsell, setShowUpsell] = useState(false);
  
  // Form state
  const [shopName, setShopName] = useState("");
  const [location, setLocation] = useState("");
  const [yearsInBusiness, setYearsInBusiness] = useState("");
  const [shopTypes, setShopTypes] = useState<string[]>([]);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [equipmentOther, setEquipmentOther] = useState("");
  const [materials, setMaterials] = useState<string[]>([]);
  const [materialsOther, setMaterialsOther] = useState("");
  const [products, setProducts] = useState<string[]>([]);
  const [productsOther, setProductsOther] = useState("");
  const [customInstructions, setCustomInstructions] = useState("");

  // Load existing context on mount
  useEffect(() => {
    if (open && userId) {
      loadExistingContext();
    }
  }, [open, userId]);

  const loadExistingContext = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("user-context", {
        body: { action: "get", user_id: userId },
      });

      if (error) throw error;

      if (data?.context) {
        const contextMap = new Map<string, string>(
          data.context.map((c: { context_type: string; context_key: string; context_value: string }) => 
            [`${c.context_type}:${c.context_key}`, c.context_value]
          )
        );

        setShopName(contextMap.get("shop_info:shop_name") || "");
        setLocation(contextMap.get("shop_info:location") || "");
        setYearsInBusiness(contextMap.get("shop_info:years_in_business") || "");
        
        const shopTypesValue = contextMap.get("shop_info:shop_types");
        setShopTypes(shopTypesValue ? shopTypesValue.split(",") : []);

        const equipmentValue = contextMap.get("equipment:list");
        setEquipment(equipmentValue ? equipmentValue.split(",") : []);
        setEquipmentOther(contextMap.get("equipment:other") || "");

        const materialsValue = contextMap.get("materials:list");
        setMaterials(materialsValue ? materialsValue.split(",") : []);
        setMaterialsOther(contextMap.get("materials:other") || "");

        const productsValue = contextMap.get("products:list");
        setProducts(productsValue ? productsValue.split(",") : []);
        setProductsOther(contextMap.get("products:other") || "");

        setCustomInstructions(contextMap.get("preferences:custom_instructions") || "");
      }
    } catch (error) {
      console.error("Error loading context:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleArrayItem = (arr: string[], setArr: (val: string[]) => void, item: string) => {
    if (arr.includes(item)) {
      setArr(arr.filter((i) => i !== item));
    } else {
      setArr([...arr, item]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const contextItems: { context_type: string; context_key: string; context_value: string }[] = [];

      // Shop info
      if (shopName) contextItems.push({ context_type: "shop_info", context_key: "shop_name", context_value: shopName });
      if (location) contextItems.push({ context_type: "shop_info", context_key: "location", context_value: location });
      if (yearsInBusiness) contextItems.push({ context_type: "shop_info", context_key: "years_in_business", context_value: yearsInBusiness });
      if (shopTypes.length > 0) contextItems.push({ context_type: "shop_info", context_key: "shop_types", context_value: shopTypes.join(",") });

      // Equipment
      if (equipment.length > 0) contextItems.push({ context_type: "equipment", context_key: "list", context_value: equipment.join(",") });
      if (equipmentOther) contextItems.push({ context_type: "equipment", context_key: "other", context_value: equipmentOther });

      // Materials
      if (materials.length > 0) contextItems.push({ context_type: "materials", context_key: "list", context_value: materials.join(",") });
      if (materialsOther) contextItems.push({ context_type: "materials", context_key: "other", context_value: materialsOther });

      // Products
      if (products.length > 0) contextItems.push({ context_type: "products", context_key: "list", context_value: products.join(",") });
      if (productsOther) contextItems.push({ context_type: "products", context_key: "other", context_value: productsOther });

      // Custom instructions
      if (customInstructions) contextItems.push({ context_type: "preferences", context_key: "custom_instructions", context_value: customInstructions.substring(0, MAX_CUSTOM_INSTRUCTIONS) });

      // Check limit
      if (contextItems.length > MAX_CONTEXT_ITEMS) {
        toast({
          title: "Too many items",
          description: `Free users can add up to ${MAX_CONTEXT_ITEMS} context items.`,
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase.functions.invoke("user-context", {
        body: { action: "save", user_id: userId, context_items: contextItems },
      });

      if (error) throw error;

      toast({
        title: "Training saved!",
        description: "I'll now personalize answers based on your shop profile.",
      });

      setShowUpsell(true);
      onTrainingComplete();
    } catch (error: any) {
      console.error("Error saving context:", error);
      toast({
        title: "Error",
        description: "Failed to save training data. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseUpsell = () => {
    setShowUpsell(false);
    onClose();
  };

  if (showUpsell) {
    return (
      <Sheet open={open} onOpenChange={handleCloseUpsell}>
        <SheetContent className="w-full sm:max-w-md bg-card border-border overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-foreground">
              <Sparkles className="h-5 w-5 text-primary" />
              Training Complete!
            </SheetTitle>
          </SheetHeader>
          
          <div className="mt-6 space-y-6">
            <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-foreground">
                Nice! I'll now personalize answers based on your shop profile.
              </p>
            </div>

            <div className="p-4 bg-muted rounded-lg border border-border">
              <h4 className="font-medium text-foreground flex items-center gap-2">
                <span className="text-lg">💡</span> Want this for your whole team?
              </h4>
              <p className="text-sm text-muted-foreground mt-2">
                Sign companies can get a fully customized SignMaker.ai — trained on your SOPs, products, and brand voice — for your staff and website.
              </p>
              <Button className="mt-4 w-full" variant="default">
                Learn More
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>

            <Button variant="outline" className="w-full" onClick={handleCloseUpsell}>
              Close
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg bg-card border-border overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 text-foreground">
            <GraduationCap className="h-5 w-5 text-primary" />
            Train Your Assistant
          </SheetTitle>
          <SheetDescription>
            Add context so I can give you more relevant answers
          </SheetDescription>
        </SheetHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        ) : (
          <div className="mt-6 space-y-8">
            {/* Section 1: About Your Shop */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground border-b border-border pb-2">
                About Your Shop
              </h3>
              
              <div className="space-y-2">
                <Label htmlFor="shopName">Shop Name</Label>
                <Input
                  id="shopName"
                  placeholder="Your shop name"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  className="bg-muted border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location / Region</Label>
                <Input
                  id="location"
                  placeholder="e.g., Phoenix, AZ"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="bg-muted border-border"
                />
              </div>

              <div className="space-y-2">
                <Label>Years in Business</Label>
                <Select value={yearsInBusiness} onValueChange={setYearsInBusiness}>
                  <SelectTrigger className="bg-muted border-border">
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="<1">Less than 1 year</SelectItem>
                    <SelectItem value="1-5">1-5 years</SelectItem>
                    <SelectItem value="5-10">5-10 years</SelectItem>
                    <SelectItem value="10+">10+ years</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Shop Type</Label>
                <div className="grid grid-cols-2 gap-2">
                  {SHOP_TYPE_OPTIONS.map((option) => (
                    <div key={option.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`shopType-${option.id}`}
                        checked={shopTypes.includes(option.id)}
                        onCheckedChange={() => toggleArrayItem(shopTypes, setShopTypes, option.id)}
                      />
                      <label
                        htmlFor={`shopType-${option.id}`}
                        className="text-sm text-foreground cursor-pointer"
                      >
                        {option.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Section 2: Equipment */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground border-b border-border pb-2">
                Your Equipment
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {EQUIPMENT_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`equipment-${option.id}`}
                      checked={equipment.includes(option.id)}
                      onCheckedChange={() => toggleArrayItem(equipment, setEquipment, option.id)}
                    />
                    <label
                      htmlFor={`equipment-${option.id}`}
                      className="text-sm text-foreground cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              <Input
                placeholder="Other equipment..."
                value={equipmentOther}
                onChange={(e) => setEquipmentOther(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            {/* Section 3: Materials */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground border-b border-border pb-2">
                Materials You Stock
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {MATERIALS_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`materials-${option.id}`}
                      checked={materials.includes(option.id)}
                      onCheckedChange={() => toggleArrayItem(materials, setMaterials, option.id)}
                    />
                    <label
                      htmlFor={`materials-${option.id}`}
                      className="text-sm text-foreground cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              <Input
                placeholder="Other materials..."
                value={materialsOther}
                onChange={(e) => setMaterialsOther(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            {/* Section 4: Products */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground border-b border-border pb-2">
                What You Make
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {PRODUCTS_OPTIONS.map((option) => (
                  <div key={option.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`products-${option.id}`}
                      checked={products.includes(option.id)}
                      onCheckedChange={() => toggleArrayItem(products, setProducts, option.id)}
                    />
                    <label
                      htmlFor={`products-${option.id}`}
                      className="text-sm text-foreground cursor-pointer"
                    >
                      {option.label}
                    </label>
                  </div>
                ))}
              </div>
              <Input
                placeholder="Other products..."
                value={productsOther}
                onChange={(e) => setProductsOther(e.target.value)}
                className="bg-muted border-border"
              />
            </div>

            {/* Section 5: Custom Instructions */}
            <div className="space-y-4">
              <h3 className="font-medium text-foreground border-b border-border pb-2">
                Custom Instructions
              </h3>
              <div className="space-y-2">
                <Label htmlFor="customInstructions">Anything else I should know?</Label>
                <Textarea
                  id="customInstructions"
                  placeholder="e.g., We only work with restaurants, We outsource all electrical, Our max letter size is 36 inches..."
                  value={customInstructions}
                  onChange={(e) => setCustomInstructions(e.target.value.substring(0, MAX_CUSTOM_INSTRUCTIONS))}
                  className="bg-muted border-border min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground text-right">
                  {customInstructions.length}/{MAX_CUSTOM_INSTRUCTIONS} characters
                </p>
              </div>
            </div>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full bg-primary text-primary-foreground hover:neon-glow-strong"
            >
              {isSaving ? "Saving..." : "Save & Apply"}
            </Button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default TrainMePanel;