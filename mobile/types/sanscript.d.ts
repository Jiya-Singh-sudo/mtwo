declare module "sanscript" {
  const Sanscript: {
    t: (
      text: string,
      from: string,
      to: string,
      options?: Record<string, unknown>
    ) => string;
  };

  export default Sanscript;
}