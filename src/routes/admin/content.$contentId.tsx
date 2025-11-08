import { useEffect, useMemo } from "react";
import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ADMIN_CONTENT_MOCK, type AdminContentItem } from "@/features/admin/content/mockData";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/admin/EmptyState";

type ContentForm = {
  title: string;
  summary: string;
  body: string;
  category: AdminContentItem["category"];
  status: AdminContentItem["status"];
};

export const Route = createFileRoute("/admin/content/$contentId")({
  component: AdminContentDetailComponent,
});

function AdminContentDetailComponent() {
  const { contentId } = Route.useParams();
  const search = useSearch({ from: "/admin/content/$contentId" }) as { mode?: string };
  const navigate = useNavigate();
  const isCreate = contentId === "new";
  const allowEdit = isCreate || search.mode === "edit";

  const contentItem = useMemo(
    () => ADMIN_CONTENT_MOCK.find((item) => item.id === contentId),
    [contentId]
  );

  const { register, handleSubmit, reset, watch } = useForm<ContentForm>({
    defaultValues: contentItem ?? {
      title: "",
      summary: "",
      body: "",
      category: "Announcement",
      status: "draft",
    },
  });

  useEffect(() => {
    if (contentItem) {
      reset({
        title: contentItem.title,
        summary: contentItem.summary,
        body: contentItem.body,
        category: contentItem.category,
        status: contentItem.status,
      });
    } else if (isCreate) {
      reset({
        title: "",
        summary: "",
        body: "",
        category: "Announcement",
        status: "draft",
      });
    }
  }, [contentItem, isCreate, reset]);

  const onSubmit = handleSubmit((values) => {
    console.info("Content update payload", values);
    toast.success("Content saved. Workflow tasks updated.");
  });

  if (!contentItem && !isCreate) {
    return (
      <ProtectedRoute allowedRoles={["Admin"]}>
        <DashboardLayout>
          <EmptyState
            title="Content entry not found"
            description="It may have been deleted or archived."
            action={
              <Button onClick={() => navigate({ to: "/admin/content" })}>Back to content</Button>
            }
          />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute allowedRoles={["Admin"]}>
      <DashboardLayout>
        <div className="space-y-8">
          <AdminPageHeader
            title={contentItem?.title ?? (isCreate ? "Create content" : "Content")}
            description={
              isCreate
                ? "Draft a new announcement, blog post, or staff profile for publication."
                : "Manage publication workflow, preview final layout, and audit activity."
            }
            breadcrumbs={[
              { label: "Dashboard", href: "/admin/dashboard" },
              { label: "Content", href: "/admin/content" },
              { label: contentItem?.title ?? (isCreate ? "Create" : "Details") },
            ]}
            actions={
              <>
                <Button variant="outline" onClick={() => window.print()}>
                  Export PDF
                </Button>
                {!isCreate ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() =>
                        navigate({
                          to: "/admin/content/$contentId",
                          params: { contentId },
                          search: { mode: allowEdit ? undefined : "edit" },
                        })
                      }
                    >
                      {allowEdit ? "Cancel edit" : "Edit content"}
                    </Button>
                    <Button variant="destructive" onClick={() => toast.info("Content archived.")}>
                      Archive
                    </Button>
                  </>
                ) : null}
              </>
            }
          />

          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <form onSubmit={onSubmit}>
                <CardHeader>
                  <CardTitle>Content details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title</Label>
                    <Input
                      id="title"
                      disabled={!allowEdit}
                      {...register("title")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="summary">Summary</Label>
                    <textarea
                      id="summary"
                      className="min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      disabled={!allowEdit}
                      {...register("summary")}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="body">Body</Label>
                    <textarea
                      id="body"
                      className="min-h-[240px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                      disabled={!allowEdit}
                      {...register("body")}
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <select
                        id="category"
                        className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                        disabled={!allowEdit}
                        {...register("category")}
                      >
                        <option value="Announcement">Announcement</option>
                        <option value="Blog">Blog</option>
                        <option value="Doctor profile">Doctor profile</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={watch("status")} />
                        {allowEdit ? (
                          <select
                            className="h-10 rounded-md border border-input bg-background px-3 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                            {...register("status")}
                          >
                            <option value="draft">Draft</option>
                            <option value="published">Published</option>
                            <option value="archived">Archived</option>
                          </select>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardContent>
                {allowEdit ? (
                  <CardFooter className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      type="button"
                      onClick={() =>
                        navigate({
                          to: "/admin/content/$contentId",
                          params: { contentId },
                        })
                      }
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Save changes</Button>
                  </CardFooter>
                ) : null}
              </form>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Publication timeline</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium">
                      {contentItem?.createdAt
                        ? new Date(contentItem.createdAt).toLocaleString()
                        : "Not saved"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last updated</span>
                    <span className="font-medium">
                      {contentItem?.updatedAt
                        ? new Date(contentItem.updatedAt).toLocaleString()
                        : "Not saved"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Workflow</span>
                    <span className="font-medium">
                      {watch("status") === "draft"
                        ? "Awaiting medical review"
                        : watch("status") === "published"
                        ? "Live on portal"
                        : "Archived"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="rounded-lg border bg-muted/40 p-4">
                    <h2 className="text-lg font-semibold text-foreground">
                      {watch("title")}
                    </h2>
                    <p className="mt-2 text-muted-foreground">{watch("summary")}</p>
                    <hr className="my-4 border-dashed" />
                    <p className="whitespace-pre-wrap text-foreground">{watch("body")}</p>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end">
                  <Button variant="outline" onClick={() => toast.info("Preview sent to reviewers.")}>
                    Send preview link
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

