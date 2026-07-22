import type { LoginFormTypes } from "@/features/(auth)/hooks/useLoginPage";
import { FormInputGroup } from "@/components/common/form/FormInputGroup";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import Link from "next/link";
import { EyeIcon, EyeOffIcon, Loader2 } from "lucide-react";

type LoginFormProps = {
  form: LoginFormTypes;
  isPasswordVisible: boolean;
  setIsPasswordVisible: (isVisible: boolean) => void;
  loading: boolean;
};

const LoginForm = ({
  form,
  isPasswordVisible,
  setIsPasswordVisible,
  loading,
}: LoginFormProps) => {
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
        <form.AppField name="password">
          {(field) => (
            <field.InputGroup
              label="Password"
              type={isPasswordVisible ? "text" : "password"}
              autoComplete="password"
              placeholder="Enter password"
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
      </FieldGroup>
      <Button type="submit" className="w-full mt-5" disabled={loading}>
        {loading ? (
          <div className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Signing in...
          </div>
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
};

export default LoginForm;
