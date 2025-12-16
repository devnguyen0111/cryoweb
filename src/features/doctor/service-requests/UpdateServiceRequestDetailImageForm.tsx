import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/api/client";
import type { ServiceRequestDetail } from "@/api/types";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Upload, X, Image as ImageIcon } from "lucide-react";

interface UpdateServiceRequestDetailImageFormProps {
  detail: ServiceRequestDetail;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UpdateServiceRequestDetailImageForm({
  detail,
  isOpen,
  onClose,
  onSuccess,
}: UpdateServiceRequestDetailImageFormProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(
    detail.imageUrl || detail.fileUrl || null
  );
  const [imageUrl, setImageUrl] = useState<string>(
    detail.imageUrl || detail.fileUrl || ""
  );

  const uploadMediaMutation = useMutation({
    mutationFn: async (file: File) => {
      return await api.media.uploadMedia({
        file,
        entityType: "ServiceRequestDetail",
        entityId: detail.id,
        description: `Image for service request detail ${detail.serviceName || detail.id}`,
      });
    },
    onSuccess: (response) => {
      if (response.data?.fileUrl) {
        setImageUrl(response.data.fileUrl);
        setImagePreview(response.data.fileUrl);
        toast.success("Image uploaded successfully");
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message || "Failed to upload image";
      toast.error(message);
    },
  });

  const updateDetailMutation = useMutation({
    mutationFn: async (data: {
      imageUrl?: string | null;
      fileUrl?: string | null;
      mediaId?: string | null;
    }) => {
      return await api.serviceRequestDetails.updateServiceRequestDetails(
        detail.id,
        {
          imageUrl: data.imageUrl,
          fileUrl: data.fileUrl,
          mediaId: data.mediaId,
        }
      );
    },
    onSuccess: () => {
      toast.success("Service request detail updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["service-request-details", detail.serviceRequestId],
      });
      queryClient.invalidateQueries({
        queryKey: ["service-request", "detail", detail.serviceRequestId],
      });
      onSuccess?.();
      handleClose();
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        "Failed to update service request detail";
      toast.error(message);
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please select an image file");
        return;
      }
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error("Image size must be less than 10MB");
        return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImagePreview(null);
    setImageUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      await uploadMediaMutation.mutateAsync(selectedFile);
    }
  };

  const handleSave = async () => {
    // If we have a selected file, upload it first
    if (selectedFile) {
      try {
        const uploadResponse =
          await uploadMediaMutation.mutateAsync(selectedFile);
        if (uploadResponse.data?.fileUrl) {
          await updateDetailMutation.mutateAsync({
            imageUrl: uploadResponse.data.fileUrl,
            fileUrl: uploadResponse.data.fileUrl,
            mediaId: uploadResponse.data.id,
          });
        }
      } catch (error) {
        // Error already handled in mutation
      }
    } else if (imageUrl) {
      // Just update with the URL
      await updateDetailMutation.mutateAsync({
        imageUrl: imageUrl,
        fileUrl: imageUrl,
      });
    } else {
      // Remove image
      await updateDetailMutation.mutateAsync({
        imageUrl: null,
        fileUrl: null,
        mediaId: null,
      });
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setImagePreview(detail.imageUrl || detail.fileUrl || null);
    setImageUrl(detail.imageUrl || detail.fileUrl || "");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onClose();
  };

  const isLoading =
    uploadMediaMutation.isPending || updateDetailMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Update Service Request Detail Image"
      size="md"
    >
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Service
                </Label>
                <p className="mt-1 text-sm text-gray-900">
                  {detail.serviceName || "—"}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-upload" className="text-sm font-medium">
                  Upload Image
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="image-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="flex-1"
                    disabled={isLoading}
                  />
                  {selectedFile && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleUpload}
                      disabled={isLoading || uploadMediaMutation.isPending}
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Supported formats: JPG, PNG, GIF. Max size: 10MB
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="image-url" className="text-sm font-medium">
                  Or Enter Image URL
                </Label>
                <Input
                  id="image-url"
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  disabled={isLoading}
                />
              </div>

              {imagePreview && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Preview</Label>
                  <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-64 object-contain"
                      onError={() => {
                        setImagePreview(null);
                        toast.error("Failed to load image");
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={handleRemoveImage}
                      disabled={isLoading}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {!imagePreview && (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <ImageIcon className="h-12 w-12 mx-auto text-gray-400 mb-2" />
                  <p className="text-sm text-gray-500">
                    No image selected. Upload an image or enter an image URL.
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleSave} disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Image"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
