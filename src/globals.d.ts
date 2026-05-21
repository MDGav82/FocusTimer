// To avoid TypeScript errors when importing CSS files, we declare a module for "*.css" files.
declare module "*.css" {
  const content: string;
  export default content;
}
declare module "@/lib/globals" {
  const content: string;
  export default content;
}
