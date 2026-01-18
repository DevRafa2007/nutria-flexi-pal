import { loadStripe } from '@stripe/stripe-js';
import {
    EmbeddedCheckoutProvider,
    EmbeddedCheckout
} from '@stripe/react-stripe-js';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

// Initialize Stripe outside of component
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    clientSecret: string | null;
}

export default function CheckoutModal({ isOpen, onClose, clientSecret }: CheckoutModalProps) {
    if (!clientSecret) return null;

    const options = {
        clientSecret,
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-background border-primary/20 max-h-[90vh] flex flex-col">
                <DialogHeader className="p-4 border-b flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        Finalizar Assinatura
                    </DialogTitle>
                    {/* Close button is handled by DialogPrimitive Close, but custom header implies we might want custom close if needed. Default X is fine. */}
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                    <EmbeddedCheckoutProvider
                        stripe={stripePromise}
                        options={options}
                    >
                        <EmbeddedCheckout className="w-full h-full min-h-[400px]" />
                    </EmbeddedCheckoutProvider>
                </div>
            </DialogContent>
        </Dialog>
    );
}
