type RequiredLabelProps = {
  children: React.ReactNode;
  required?: boolean;
};

export function RequiredLabel({ children, required }: RequiredLabelProps) {
  return (
    <label>
      {children}
      {required && <span className="required">*</span>}
    </label>
  );
}
