import { FormInputGroup } from "@/components/common/form/FormInputGroup";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";
import type { RegisterFormTypes } from "../hooks/useSignupPage";

type RegisterFormProps = {
  form: RegisterFormTypes;
  isPasswordVisible: boolean;
  setIsPasswordVisible: (isVisible: boolean) => void;
  loading: boolean;
};

const RegisterForm = ({
  form,
  isPasswordVisible,
  setIsPasswordVisible,
  loading,
}: RegisterFormProps) => {
  return (
    <form
      className="w-full"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField name="username">
          {(field) => (
            <field.Input
              label="Username"
              type="text"
              autoComplete="username"
              placeholder="Enter your username"
              className="h-11"
            />
          )}
        </form.AppField>
        <form.AppField name="email">
          {(field) => (
            <field.Input
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="Enter your email"
              className="h-11"
            />
          )}
        </form.AppField>
        <form.AppField name="password">
          {(field) => (
            <field.InputGroup
              label="Password"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="password"
              placeholder="At least 8 characters"
              groupClasses="h-11"
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
        <Link
          href="/forgot-password"
          className="text-xs text-muted-foreground text-right hover:text-blue-500"
        >
          Forgot password?
        </Link>
        <form.AppField name="privacyPolicy">
          {(field) => (
            <field.Checkbox
              label="I agree to the privacy policy"
              required={true}
            />
          )}
        </form.AppField>
      </FieldGroup>
      <Button type="submit" className="w-full mt-5" disabled={loading}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Registering...
          </div>
        ) : (
          "Register"
        )}
      </Button>
    </form>
  );
};

export default RegisterForm;
