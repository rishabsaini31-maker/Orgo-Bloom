"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { productApi } from "@/lib/api-client";
import { generateSlug } from "@/lib/utils";
import { useAuthStore } from "@/store/auth-store";
import toast from "react-hot-toast";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    price: "",
    weight: "",
    stock: "",
    imageUrl: "",
    images: [] as string[],
    category: "cow" as "cow" | "chicken",
    benefits: "",
    usage: "",
    composition: "",
    isActive: true,
    isFeatured: false,
  });

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await productApi.getById(productId);
      const product = response.data.product;

      setFormData({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        weight: product.weight || "",
        stock: product.stock?.toString() || "",
        imageUrl: product.imageUrl || "",
        images: product.images || [],
        category: product.category || "cow",
        benefits: product.benefits ? product.benefits.join("\n") : "",
        usage: product.usage || "",
        composition: product.composition || "",
        isActive: product.isActive ?? true,
        isFeatured: product.isFeatured ?? false,
      });
    } catch (error: any) {
      toast.error("Failed to load product");
      router.push("/admin/products");
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (name: string) => {
    setFormData({
      ...formData,
      name,
      slug: generateSlug(name),
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (!token) {
      toast.error("Please login to upload images");
      return;
    }

    if (formData.images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed");
      return;
    }

    setUploadingImages(true);
    const newImageUrls: string[] = [];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileSizeMB = (file.size / 1024 / 1024).toFixed(2);
        console.log(`Uploading: ${file.name} (${fileSizeMB}MB)`);
        toast.loading(`Uploading ${file.name} (${fileSizeMB}MB)...`);

        const formDataToUpload = new FormData();
        formDataToUpload.append("file", file);
        formDataToUpload.append("type", "image");

        const response = await fetch("/api/upload", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formDataToUpload,
          signal: AbortSignal.timeout(600000), // 10 minute timeout for 150MB files
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || `Failed to upload ${file.name}`);
        }

        const data = await response.json();
        console.log(`✓ Upload complete: ${file.name}`, data);
        newImageUrls.push(data.url);
      }

      setFormData({
        ...formData,
        images: [...formData.images, ...newImageUrls],
      });
      console.log("Image URLs stored:", newImageUrls);
      toast.success(`${files.length} image(s) uploaded successfully`);
    } catch (error: any) {
      toast.error(error.message || "Failed to upload images");
    } finally {
      setUploadingImages(false);
      // Reset input
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const removeImage = (index: number) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, i) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const benefitsArray = formData.benefits
        .split("\n")
        .filter((b) => b.trim())
        .map((b) => b.trim());

      await productApi.update(productId, {
        name: formData.name,
        slug: formData.slug,
        description: formData.description,
        price: parseFloat(formData.price),
        weight: formData.weight,
        stock: parseInt(formData.stock),
        imageUrl: formData.imageUrl || undefined,
        images: formData.images.length > 0 ? formData.images : undefined,
        category: formData.category,
        benefits: benefitsArray.length > 0 ? benefitsArray : undefined,
        usage: formData.usage || undefined,
        composition: formData.composition || undefined,
        isActive: formData.isActive,
        isFeatured: formData.isFeatured,
      });

      toast.success("Product updated successfully");
      router.push("/admin/products");
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to update product");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="text-primary-600 hover:text-primary-700 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6 space-y-6"
        >
          <div>
            <label className="block text-sm font-medium mb-2">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => handleNameChange(e.target.value)}
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Slug *</label>
            <input
              type="text"
              required
              value={formData.slug}
              onChange={(e) =>
                setFormData({ ...formData, slug: e.target.value })
              }
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              URL-friendly version of the name
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description *
            </label>
            <textarea
              required
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="input min-h-[100px]"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
                className="input"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Weight *</label>
              <input
                type="text"
                required
                placeholder="e.g., 5 kg"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({ ...formData, weight: e.target.value })
                }
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Stock Quantity *
            </label>
            <input
              type="number"
              required
              value={formData.stock}
              onChange={(e) =>
                setFormData({ ...formData, stock: e.target.value })
              }
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Category *</label>
            <select
              required
              value={formData.category}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  category: e.target.value as "cow" | "chicken",
                })
              }
              className="input"
            >
              <option value="cow">Cow Manure</option>
              <option value="chicken">Chicken Manure</option>
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Select the type of manure for this product
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Image URL</label>
            <input
              type="url"
              value={formData.imageUrl}
              onChange={(e) =>
                setFormData({ ...formData, imageUrl: e.target.value })
              }
              className="input"
              placeholder="https://example.com/image.jpg"
            />
            <p className="text-xs text-gray-500 mt-1">
              Optional: Use for single image
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Product Images (3-5 images recommended)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center bg-gray-50">
              <input
                type="file"
                id="images-upload"
                multiple
                accept="image/png,image/jpeg"
                onChange={handleImageUpload}
                disabled={uploadingImages || formData.images.length >= 5}
                className="hidden"
              />
              <label
                htmlFor="images-upload"
                className={`cursor-pointer block ${
                  uploadingImages || formData.images.length >= 5
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                <svg
                  className="mx-auto h-12 w-12 text-gray-400 mb-2"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle cx={30} cy={20} r={4} strokeWidth={2} />
                  <path
                    d="M44 8l-8.5 8.5M44 8l-8.5-8.5M44 8v0"
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </svg>
                <p className="text-sm font-medium text-gray-700">
                  {uploadingImages
                    ? "Uploading..."
                    : "Click or drag images here"}
                </p>
                <p className="text-xs text-gray-500">
                  PNG or JPG up to 50MB each (large files may take time to
                  upload)
                </p>
              </label>
            </div>

            {formData.images.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">
                  Uploaded Images ({formData.images.length}/5)
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div
                      key={index}
                      className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-100 h-32"
                    >
                      <img
                        src={image}
                        alt={`Product ${index + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={(e) => {
                          console.error(`Failed to load image: ${image}`);
                          (e.target as HTMLImageElement).src =
                            "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect fill='%23ddd' width='100' height='100'/%3E%3Ctext x='50' y='50' text-anchor='middle' dy='.3em' fill='%23666' font-size='12'%3EImage not found%3C/text%3E%3C/svg%3E";
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Benefits (one per line)
            </label>
            <textarea
              value={formData.benefits}
              onChange={(e) =>
                setFormData({ ...formData, benefits: e.target.value })
              }
              className="input min-h-[100px]"
              placeholder="Improves soil health&#10;Increases plant growth&#10;100% organic"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Usage Instructions
            </label>
            <textarea
              value={formData.usage}
              onChange={(e) =>
                setFormData({ ...formData, usage: e.target.value })
              }
              className="input min-h-[80px]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Composition
            </label>
            <textarea
              value={formData.composition}
              onChange={(e) =>
                setFormData({ ...formData, composition: e.target.value })
              }
              className="input min-h-[80px]"
            />
          </div>

          <div className="flex gap-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm font-medium">
                Active (visible to customers)
              </span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={formData.isFeatured}
                onChange={(e) =>
                  setFormData({ ...formData, isFeatured: e.target.checked })
                }
                className="mr-2"
              />
              <span className="text-sm font-medium">Featured Product</span>
            </label>
          </div>

          <div className="flex gap-4">
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving ? "Saving..." : "Update Product"}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
