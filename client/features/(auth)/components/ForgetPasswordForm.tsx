import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { Loader2 } from "lucide-react";
import { ForgetPasswordFormTypes } from "../hooks/useForgotPasswordPage";

type ForgetPasswordFormProps = {
  form: ForgetPasswordFormTypes;
  loading: boolean;
};

const ForgetPasswordForm = ({ form, loading }: ForgetPasswordFormProps) => {
  return (
    <form
      className="w-full max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="email">
          {(field) => (
            <field.Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
            />
          )}
        </form.AppField>
      </FieldGroup>
      <Button type="submit" className="w-full mt-5" disabled={loading}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Sending link...
          </div>
        ) : (
          "Get reset link"
        )}
      </Button>
    </form>
  );
};

export default ForgetPasswordForm;
