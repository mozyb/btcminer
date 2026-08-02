import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layouts/AdminLayout";
import { Check, X, Plus } from "lucide-react";
import { toast } from "sonner";

const roles = [
  { id: "r1", name: "Super Admin", color: "bg-destructive/10 text-destructive border-destructive/20", users: 2 },
  { id: "r2", name: "Operations", color: "bg-primary/10 text-primary border-primary/20", users: 4 },
  { id: "r3", name: "Finance", color: "bg-success/10 text-success border-success/20", users: 3 },
  { id: "r4", name: "Support", color: "bg-info/10 text-info border-info/20", users: 8 },
  { id: "r5", name: "Marketing", color: "bg-warning/10 text-warning border-warning/20", users: 2 },
];

const permissions = [
  { id: "p1", name: "View Dashboard", category: "General" },
  { id: "p2", name: "Manage Users", category: "Users" },
  { id: "p3", name: "Manage Contracts", category: "Mining" },
  { id: "p4", name: "Manage Farms", category: "Mining" },
  { id: "p5", name: "Manage Hardware", category: "Mining" },
  { id: "p6", name: "Approve Withdrawals", category: "Finance" },
  { id: "p7", name: "View Deposits", category: "Finance" },
  { id: "p8", name: "Manage APIs", category: "System" },
  { id: "p9", name: "Manage CMS", category: "Content" },
  { id: "p10", name: "Manage SEO", category: "Content" },
  { id: "p11", name: "KYC Review", category: "Compliance" },
  { id: "p12", name: "Support Tickets", category: "Support" },
  { id: "p13", name: "View Audit Logs", category: "Security" },
  { id: "p14", name: "System Settings", category: "System" },
];

// Default role-permission matrix
const defaultMatrix: Record<string, Record<string, boolean>> = {
  r1: Object.fromEntries(permissions.map(p => [p.id, true])),
  r2: Object.fromEntries(permissions.map(p => [p.id, ["p1","p3","p4","p5","p7","p8","p13"].includes(p.id)])),
  r3: Object.fromEntries(permissions.map(p => [p.id, ["p1","p6","p7","p13"].includes(p.id)])),
  r4: Object.fromEntries(permissions.map(p => [p.id, ["p1","p11","p12","p7"].includes(p.id)])),
  r5: Object.fromEntries(permissions.map(p => [p.id, ["p1","p9","p10"].includes(p.id)])),
};

export default function AdminRoles() {
  const [matrix, setMatrix] = useState(defaultMatrix);

  const toggle = (roleId: string, permId: string) => {
    setMatrix(m => ({ ...m, [roleId]: { ...m[roleId], [permId]: !m[roleId][permId] } }));
  };

  const categories = [...new Set(permissions.map(p => p.category))];

  return (
    <AdminLayout>
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-foreground">Role & Permission Management</h2>
            <p className="text-sm text-muted-foreground">{roles.length} roles · {permissions.length} permissions</p>
          </div>
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 gap-2 text-sm" onClick={() => toast.info("Role creator coming soon")}>
            <Plus className="w-4 h-4" />New Role
          </Button>
        </div>

        {/* Role Cards */}
        <div className="flex flex-wrap gap-3">
          {roles.map(r => (
            <div key={r.id} className="flex items-center gap-2 px-3 py-2 bg-card border border-border rounded">
              <Badge className={`text-xs ${r.color}`}>{r.name}</Badge>
              <span className="text-xs text-muted-foreground">{r.users} admins</span>
            </div>
          ))}
        </div>

        {/* Permission Matrix */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Permission Matrix</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full min-w-max text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap w-52">Permission</th>
                    {roles.map(r => (
                      <th key={r.id} className="text-center py-3 px-3 text-xs font-medium text-muted-foreground uppercase whitespace-nowrap">
                        {r.name}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {categories.map(cat => (
                    <React.Fragment key={cat}>
                      <tr className="bg-muted/20">
                        <td colSpan={roles.length + 1} className="py-1.5 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</td>
                      </tr>
                      {permissions.filter(p => p.category === cat).map(perm => (
                        <tr key={perm.id} className="border-b border-border last:border-0 hover:bg-muted/10">
                          <td className="py-2.5 px-4 text-sm text-foreground whitespace-nowrap">{perm.name}</td>
                          {roles.map(r => (
                            <td key={r.id} className="py-2.5 px-3 text-center whitespace-nowrap">
                              <button
                                onClick={() => r.id !== "r1" && toggle(r.id, perm.id)}
                                disabled={r.id === "r1"}
                                className={`w-6 h-6 rounded flex items-center justify-center mx-auto transition-colors ${
                                  matrix[r.id]?.[perm.id]
                                    ? r.id === "r1" ? "bg-success/20 text-success cursor-default" : "bg-success/10 text-success border border-success/30 hover:bg-success/20"
                                    : r.id === "r1" ? "hidden" : "bg-muted/30 text-muted-foreground border border-border hover:bg-muted"
                                }`}
                              >
                                {matrix[r.id]?.[perm.id] ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              </button>
                            </td>
                          ))}
                        </tr>
                      ))}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Button className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={() => toast.success("Role permissions saved.")}>
          Save Permission Matrix
        </Button>
      </div>
    </AdminLayout>
  );
}
