/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes";

declare module "*.module.css" {
  const classes: Record<string, string>;
  export default classes;
}

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
