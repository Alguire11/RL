import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Loader2, MapPin, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PostcodeLookupProps {
    onAddressSelect?: (address: { postcode: string; city: string; region: string }) => void;
    currentPostcode?: string;
}

export function UKPostcodeLookup({ onAddressSelect, currentPostcode }: PostcodeLookupProps) {
    const [postcode, setPostcode] = useState(currentPostcode || "");
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState("");
    const { toast } = useToast();

    const validateAndLookup = async () => {
        if (!postcode.trim()) {
            setError("Please enter a postcode");
            return;
        }

        setIsLoading(true);
        setError("");

        try {
            const response = await fetch(`/api/postcode/lookup/${encodeURIComponent(postcode.trim())}`);
            const contentType = response.headers.get("content-type");

            if (!contentType || !contentType.includes("application/json")) {
                throw new Error("Service temporarily unavailable. Please try again later.");
            }

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Invalid postcode");
            }

            const data = await response.json();

            // Populate address fields
            if (onAddressSelect) {
                onAddressSelect({
                    postcode: data.postcode,
                    city: data.admin_district || data.parliamentary_constituency || "",
                    region: data.region || "England",
                });
            }

            toast({
                title: "Postcode validated",
                description: `Found: ${data.admin_district || data.region}`,
            });
        } catch (err: any) {
            setError(err.message || "Failed to validate postcode");
            toast({
                title: "Invalid postcode",
                description: err.message || "Please check the postcode and try again",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") {
            e.preventDefault();
            validateAndLookup();
        }
    };

    return (
        <div className="space-y-2">
            <Label htmlFor="postcode-lookup" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                UK Postcode Lookup
            </Label>
            <div className="flex gap-2">
                <Input
                    id="postcode-lookup"
                    placeholder="e.g., SW1A 1AA"
                    value={postcode}
                    onChange={(e) => {
                        setPostcode(e.target.value.toUpperCase());
                        setError("");
                    }}
                    onKeyPress={handleKeyPress}
                    className={error ? "border-red-500" : ""}
                />
                <Button
                    type="button"
                    onClick={validateAndLookup}
                    disabled={isLoading}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Search className="h-4 w-4" />
                    )}
                </Button>
            </div>
            {error && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                    <AlertCircle className="h-4 w-4" />
                    <span>{error}</span>
                </div>
            )}
            <p className="text-xs text-gray-500">
                Enter your UK postcode to validate and auto-fill location details
            </p>
        </div>
    );
}
