import type { ResetPasswordFormTypes } from "@/features/(auth)/hooks/useResetPasswordPage";
import { FormInputGroup } from "@/components/common/form/FormInputGroup";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";

type ResetPasswordFormProps = {
  form: ResetPasswordFormTypes;
  isPasswordVisible: boolean;
  setIsPasswordVisible: (isVisible: boolean) => void;
  loading: boolean;
};

const ResetPasswordForm = ({
  form,
  isPasswordVisible,
  setIsPasswordVisible,
  loading,
}: ResetPasswordFormProps) => {
  return (
    <form
      className="w-full max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="newPassword">
          {(field) => (
            <field.InputGroup
              label="Enter New Password"
              type={isPasswordVisible ? "text" : "password"}
              placeholder="Enter new password"
            >
              <FormInputGroup.Addon align="inline-end">
                <FormInputGroup.Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => setIsPasswordVisible(!isPasswordVisible)}
                  aria-label="Toggle password visibility"
                >
                  {isPasswordVisible ? (
                    <EyeIcon className="size-4" />
                  ) : (
                    <EyeOffIcon className="size-4" />
                  )}
                </FormInputGroup.Button>
              </FormInputGroup.Addon>
            </field.InputGroup>
          )}
        </form.AppField>
        <form.AppField name="confirmPassword">
          {(field) => (
            <field.Input
              label="Confirm Password"
              type="password"
              placeholder="Re-enter your new password"
            />
          )}
        </form.AppField>
      </FieldGroup>
      <Button type="submit" className="w-full mt-5" disabled={loading}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Resetting password...
          </div>
        ) : (
          "Reset password"
        )}
      </Button>
    </form>
  );
};

export default ResetPasswordForm;
