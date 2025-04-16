import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Link from "next/link";

export default function ExamplesPage() {
  const examples = [
    {
      title: "Radio Group",
      description: "Example of the RadioGroup component.",
      href: "/examples/radio-group",
    },
    {
      title: "Auth Test",
      description: "Test the authentication context and user state.",
      href: "/examples/auth-test",
    },
    {
      title: "Role-Based Access",
      description:
        "Example of implementing role-based access controls with the auth context.",
      href: "/examples/role-based-access",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold mb-2">Available Examples</h2>
        <p className="text-muted-foreground">
          Click on any card below to see the example in action.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {examples.map((example) => (
          <Card
            key={example.href}
            className="hover:bg-muted/50 transition-colors"
          >
            <Link href={example.href} className="block">
              <CardHeader>
                <CardTitle>{example.title}</CardTitle>
                <CardDescription>{example.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-muted-foreground">
                  Click to view example
                </div>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
