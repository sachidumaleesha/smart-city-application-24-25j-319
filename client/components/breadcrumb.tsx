import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

// Import the data directly from the source file
// Make sure the path is correct relative to this file"
import { data } from "./app-sidebar";

const BreadCrumb = () => {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/dashboard">dashboard</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        {/* Add a check to ensure adminNavMain exists before mapping */}
        {data?.adminNavMain?.map((item) => (
          <BreadcrumbItem key={item.breadcrumb}>
            <BreadcrumbLink href={item.url}>{item.title}</BreadcrumbLink>
          </BreadcrumbItem>
        ))}
        {/* Only add separator if there are items */}
        {data?.adminNavMain?.length > 0 && <BreadcrumbSeparator />}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default BreadCrumb;
