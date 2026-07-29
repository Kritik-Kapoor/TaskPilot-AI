import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

interface FormDialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string | React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  closeOnOutsideClick?: boolean;
  isTitleHidden?: boolean;
  overlayClassName?: string;
}

const FormDialog = ({
  children,
  isOpen,
  onClose,
  title,
  style,
  className,
  closeOnOutsideClick = true,
  isTitleHidden = false,
  overlayClassName,
}: FormDialogProps) => {
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        className={cn("sm:max-w-[425px] md:max-w-125", className)}
        overlayClassName={overlayClassName}
        style={style}
        onPointerDownOutside={
          closeOnOutsideClick ? undefined : (e) => e.preventDefault()
        }
      >
        <DialogHeader>
          {isTitleHidden ? (
            <DialogTitle asChild>
              <VisuallyHidden>{title}</VisuallyHidden>
            </DialogTitle>
          ) : (
            <DialogTitle>{title}</DialogTitle>
          )}
        </DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default FormDialog;
