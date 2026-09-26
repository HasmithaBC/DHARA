"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { adminJSON, API_BASE } from "@/lib/admin-api";
import LocationMap from "./LocationMap";

export interface PropertyDocument {
  id?: string;
  title: string;
  file_url: string;
  document_type: "SURVEY_PLAN" | "FLOOR_PLAN" | "BROCHURE" | "APPROVAL" | "OTHER";
  access: "PUBLIC" | "GATED" | "INTERNAL";
}

export interface PropertyFormValues {
  reference_code?: string;
  title: string;
  slug: string;
  category: "LAND" | "HOUSE" | "COMMERCIAL" | "OTHER";
  listing_type: "SALE" | "RENT";
  short_description: string;
  description: string;

  price_lkr: string;
  price_on_request: boolean;
  price_unit: string;
  is_negotiable: boolean;
  rent_period: string;
  minimum_lease_months: string;
  advance_months: string;
  deposit_lkr: string;

  province: string;
  district: string;
  city: string;
  address_line: string;
  map_url: string;
  latitude: string;
  longitude: string;
  show_exact_location: boolean;

  land_area_unit: "PERCHES" | "ACRES";
  land_area_count: string;
  road_access: boolean;
  road_width_ft: string;
  road_surface: "CARPETED" | "CONCRETE" | "GRAVEL" | "OTHER" | "";
  land_shape: "RECTANGULAR" | "SQUARE" | "TRIANGULAR" | "IRREGULAR" | "";
  frontage_ft: string;
  land_type: "RESIDENTIAL" | "AGRICULTURAL" | "COMMERCIAL" | "INDUSTRIAL" | "";

  bedrooms: string;
  bathrooms: string;
  floor_count: string;
  parking_spaces: string;
  built_area_sqft: string;
  year_built: string;
  furnishing: "UNFURNISHED" | "SEMI_FURNISHED" | "FULLY_FURNISHED" | "";
  condition: "NEW" | "USED" | "SEMI_FINISHED" | "UNDER_CONSTRUCTION" | "";

  is_featured: boolean;

  // STEP 3 NEW FIELDS
  has_electricity: "3_PHASE" | "SINGLE_PHASE" | "NONE" | "";
  water_source: "MAINS" | "WELL" | "BOTH" | "NONE" | "";
  deed_type: "CLEAR_DEED" | "BIM_SAVIYA" | "LEASEHOLD" | "OTHER" | "";
  deed_note: string;

  features: {
    has_boundary_wall: boolean;
    has_solar: boolean;
    ac_ready: boolean;
    beachfront_sea_view: boolean;
    waterfront_riverside: boolean;
    hillside: boolean;
    paddy_front: boolean;
    lake_front: boolean;
    indoor_garden: boolean;
    garage: boolean;
    swimming_pool: boolean;
    gated_community: boolean;
    roof_top_garden: boolean;
    lawn_garden: boolean;
    luxury_specification: boolean;
    security_24_hours: boolean;
    colonial_architecture: boolean;
    maids_room: boolean;
    infinity_pool: boolean;
    home_security_system: boolean;
    maids_toilet: boolean;
    hot_water: boolean;
    overhead_water_tank: boolean;
    attached_toilets: boolean;
    permits_for_gem_mining: boolean;
    soil_test_passed: boolean;
    hilly_landscape: boolean;
    ideal_for_commercial_use: boolean;
    lake_pond_inside_land: boolean;
    bungalow_cottage_type: boolean;
    stream_running_through_land: boolean;
    approved_survey_plan: boolean;
  };

  cover_image: string;
  video_url: string;
  google_drive_url: string;
  gallery: { url: string; caption: string }[];
  meta_title: string;
  meta_description: string;
  documents: PropertyDocument[];
}


function Section({
  id,
  title,
  children,
  propertyId,
  isEditing,
  saving,
  toggleEdit
}: {
  id: string;
  title: React.ReactNode;
  children: React.ReactNode;
  propertyId?: string;
  isEditing?: boolean;
  saving?: boolean;
  toggleEdit?: (section: string) => void;
}) {
  const isLocked = propertyId && !isEditing;
  return (
    <section className="border border-stone-line bg-stone-paper p-5 mb-6 relative">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-display text-lg text-ink">{title}</h2>
        {propertyId && toggleEdit && (
          <button type="button" onClick={() => toggleEdit(id)} className="text-xs font-medium text-[#2B8B45] hover:underline px-3 py-1 border border-[#2B8B45] rounded-full z-10 relative">
            {isLocked ? "Edit" : (saving ? "Saving..." : "Save")}
          </button>
        )}
      </div>
      <div className={`transition-opacity duration-200 ${isLocked ? "opacity-60 pointer-events-none select-none" : "opacity-100"}`}>
        {children}
      </div>
    </section>
  );
}

const PROVINCE_DISTRICTS: Record<string, string[]> = {
  "Central": ["Kandy", "Matale", "Nuwara Eliya"],
  "Eastern": ["Ampara", "Batticaloa", "Trincomalee"],
  "North Central": ["Anuradhapura", "Polonnaruwa"],
  "Northern": ["Jaffna", "Kilinochchi", "Mannar", "Mullaitivu", "Vavuniya"],
  "North Western": ["Kurunegala", "Puttalam"],
  "Sabaragamuwa": ["Kegalle", "Ratnapura"],
  "Southern": ["Galle", "Hambantota", "Matara"],
  "Uva": ["Badulla", "Moneragala"],
  "Western": ["Colombo", "Gampaha", "Kalutara"],
};

const DISTRICT_COORDS: Record<string, { lat: string, lng: string }> = {
  "Ampara": { lat: "7.2965", lng: "81.6724" },
  "Anuradhapura": { lat: "8.3114", lng: "80.4037" },
  "Badulla": { lat: "6.9934", lng: "81.0550" },
  "Batticaloa": { lat: "7.7170", lng: "81.6986" },
  "Colombo": { lat: "6.9271", lng: "79.8612" },
  "Galle": { lat: "6.0535", lng: "80.2210" },
  "Gampaha": { lat: "7.0873", lng: "79.9996" },
  "Hambantota": { lat: "6.1248", lng: "81.1185" },
  "Jaffna": { lat: "9.6615", lng: "80.0255" },
  "Kalutara": { lat: "6.5854", lng: "79.9607" },
  "Kandy": { lat: "7.2906", lng: "80.6337" },
  "Kegalle": { lat: "7.2513", lng: "80.3464" },
  "Kilinochchi": { lat: "9.3803", lng: "80.3770" },
  "Kurunegala": { lat: "7.4818", lng: "80.3609" },
  "Mannar": { lat: "8.9810", lng: "79.9044" },
  "Matale": { lat: "7.4675", lng: "80.6234" },
  "Matara": { lat: "5.9549", lng: "80.5469" },
  "Moneragala": { lat: "6.8728", lng: "81.3507" },
  "Mullaitivu": { lat: "9.2671", lng: "80.8142" },
  "Nuwara Eliya": { lat: "6.9497", lng: "80.7828" },
  "Polonnaruwa": { lat: "7.9403", lng: "81.0188" },
  "Puttalam": { lat: "8.0362", lng: "79.8283" },
  "Ratnapura": { lat: "6.7056", lng: "80.3847" },
  "Trincomalee": { lat: "8.5874", lng: "81.2152" },
  "Vavuniya": { lat: "8.7542", lng: "80.4982" },
};

const empty: PropertyFormValues = {
  title: "", slug: "", category: "HOUSE", listing_type: "SALE", short_description: "", description: "",

  price_lkr: "", price_on_request: false, price_unit: "TOTAL", is_negotiable: false,
  rent_period: "MONTHLY", minimum_lease_months: "", advance_months: "", deposit_lkr: "",

  province: "", district: "", city: "", address_line: "", map_url: "", latitude: "7.0", longitude: "80.0",
  show_exact_location: false,

  land_area_unit: "PERCHES", land_area_count: "", road_access: false, road_width_ft: "", road_surface: "",
  land_shape: "", frontage_ft: "", land_type: "",

  bedrooms: "", bathrooms: "", floor_count: "", parking_spaces: "", built_area_sqft: "",
  year_built: "", furnishing: "", condition: "",

  is_featured: false,

  has_electricity: "", water_source: "", deed_type: "", deed_note: "",
  features: {
    has_boundary_wall: false, has_solar: false, ac_ready: false, beachfront_sea_view: false, waterfront_riverside: false,
    hillside: false, paddy_front: false, lake_front: false, indoor_garden: false, garage: false, swimming_pool: false,
    gated_community: false, roof_top_garden: false, lawn_garden: false, luxury_specification: false, security_24_hours: false,
    colonial_architecture: false, maids_room: false, infinity_pool: false, home_security_system: false, maids_toilet: false,
    hot_water: false, overhead_water_tank: false, attached_toilets: false, permits_for_gem_mining: false, soil_test_passed: false,
    hilly_landscape: false, ideal_for_commercial_use: false, lake_pond_inside_land: false, bungalow_cottage_type: false,
    stream_running_through_land: false, approved_survey_plan: false
  },
  cover_image: "", video_url: "", google_drive_url: "", gallery: [], meta_title: "", meta_description: "", documents: []
};

export default function PropertyForm({
  propertyId,
  initial,
}: {
  propertyId?: string;
  initial?: Partial<PropertyFormValues>;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PropertyFormValues>({ ...empty, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState(1);
  const [editingSections, setEditingSections] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState<{ msg: string, type: 'error' | 'success' | 'center-info' } | null>(null);
  const [confirmModal, setConfirmModal] = useState<{ message: string, confirmText?: string, onConfirm: () => void } | null>(null);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (saving && !propertyId) {
      setToast({ msg: "Creating draft...", type: "center-info" });
      timer = setTimeout(() => {
        setToast(current => {
          if (current?.msg === "Creating draft...") {
            return { msg: "Please wait, connection speed is low...", type: "center-info" };
          }
          return current;
        });
      }, 8000);
    }
    return () => clearTimeout(timer);
  }, [saving, propertyId]);

  const showToast = (msg: string, type: 'error' | 'success' | 'center-info' = 'error') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const toggleEdit = async (section: string) => {
    if (editingSections[section]) {
      // It was in edit mode, user clicked "Save"

      const required = [
        { key: "category", name: "Property Type" },
        { key: "listing_type", name: "Listing Type" },
        { key: "province", name: "Province" },
        { key: "district", name: "District" },
        { key: "city", name: "City / Town" },
        { key: "title", name: "Title" },
        { key: "slug", name: "Slug" },
        { key: "short_description", name: "Short Description" },
        { key: "description", name: "Description" },
      ];
      const partialPayload = getSectionPayload(section);
      let missing: string[] = [];
      for (const req of required) {
        if (partialPayload.hasOwnProperty(req.key) || (section === 'location' && (req.key === 'province' || req.key === 'district' || req.key === 'city'))) {
          if (!values[req.key as keyof PropertyFormValues]) {
            missing.push(req.name);
          }
        }
      }
      if (!values.price_on_request && section === 'price_details') {
        if (!values.price_lkr) missing.push("Price (LKR)");
        if (!values.price_unit) missing.push("Price Unit");
      }
      if (missing.length > 0) {
        showToast(`Please fill in all required fields: ${missing.join(", ")}`);
        return;
      }

      if (propertyId) {
        try {
          setSaving(true);
          await adminJSON(`/properties/${propertyId}`, { method: "PATCH", body: JSON.stringify(partialPayload) });
          setSaving(false);
          showToast("Section updated successfully", "success");
        } catch (e: any) {
          let msg = e.message;
          if (msg.includes("chk_latlng")) {
            msg = "Invalid location. Latitude must be between 5.9 and 9.9, and Longitude between 79.5 and 81.9 (Sri Lanka).";
          }
          showToast(msg, "error");
          setSaving(false);
          return;
        }
      }
      setEditingSections(prev => ({ ...prev, [section]: false }));
    } else {
      setEditingSections(prev => ({ ...prev, [section]: true }));
    }
  }



  // Document form state
  const [docForm, setDocForm] = useState<PropertyDocument>({ title: "", file_url: "", document_type: "BROCHURE", access: "PUBLIC" });
  const [showDocForm, setShowDocForm] = useState(false);
  const [editingDocIndex, setEditingDocIndex] = useState<number | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Record<number, boolean>>({});

  const toggleDocExpand = (index: number) => {
    setExpandedDocs(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const totalImages = (values.cover_image ? 1 : 0) + values.gallery.length;
  const canPublish = totalImages >= 3;

  async function saveDocsToBackend(docs: any[]) {
    if (!propertyId) return;
    try {
      setSaving(true);
      await adminJSON(`/properties/${propertyId}`, {
        method: "PATCH",
        body: JSON.stringify({
          documents: docs.map(doc => ({
            ...doc,
            type: doc.document_type || doc.type,
            document_type: undefined
          }))
        })
      });
      showToast("Documents saved successfully", "success");
    } catch (e: any) {
      showToast("Failed to save documents: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function addOrUpdateDocument() {
    if (!docForm.title || !docForm.file_url) return showToast("Title and URL required");
    let newDocs = [...values.documents];
    if (editingDocIndex !== null) {
      newDocs[editingDocIndex] = docForm;
    } else {
      newDocs.push(docForm);
    }
    setValues(prev => ({ ...prev, documents: newDocs }));
    setDocForm({ title: "", file_url: "", document_type: "BROCHURE", access: "PUBLIC" });
    setShowDocForm(false);
    setEditingDocIndex(null);
    await saveDocsToBackend(newDocs);
  }

  function editDocument(index: number) {
    setDocForm(values.documents[index]);
    setEditingDocIndex(index);
    setShowDocForm(true);
  }

  async function removeDocument(index: number) {
    setConfirmModal({
      message: "Are you sure you want to remove this document? This cannot be undone.",
      confirmText: "Yes, remove",
      onConfirm: async () => {
        const newDocs = values.documents.filter((_, i) => i !== index);
        setValues(prev => ({ ...prev, documents: newDocs }));
        await saveDocsToBackend(newDocs);
      }
    });
  }

  function removeCoverImage() {
    setValues(prev => ({ ...prev, cover_image: "" }));
  }

  function removeGalleryImage(index: number) {
    setValues(prev => ({ ...prev, gallery: prev.gallery.filter((_, i) => i !== index) }));
  }

  function set<K extends keyof PropertyFormValues>(key: K, val: PropertyFormValues[K]) {
    setValues((v) => ({ ...v, [key]: val }));
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: "cover_image" | "gallery", isArray: boolean = false) => {
    const files = e.target.files;
    if (!files) return;
    const validFiles = Array.from(files).filter(file => {
      if (file.size > 20 * 1024 * 1024) {
        showToast(`Image "${file.name}" is too large. Max size is 20MB.`, "error");
        return false;
      }
      return true;
    });
    validFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        if (isArray) {
          setValues(prev => ({ ...prev, gallery: [...prev.gallery, { url: base64, caption: "" }] }));
        } else {
          set(field as any, base64);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSingleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 20 * 1024 * 1024) {
      showToast(`Document "${file.name}" is too large. Max size is 20MB.`, "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setDocForm(prev => ({
        ...prev,
        title: prev.title || file.name,
        file_url: base64
      }));
    };
    reader.readAsDataURL(file);
  };

  function getSectionPayload(section: string) {
    const fullPayload = toPayload();
    const sectionFields: Record<string, string[]> = {
      property_type: ["category", "listing_type"],
      location: ["province_id", "district_id", "city_id", "province", "district", "city", "address_line", "map_url", "latitude", "longitude", "show_exact_location"],
      property_details: ["land_area_unit", "land_area_count", "road_access", "road_width_ft", "road_surface", "land_shape", "frontage_ft", "land_type", "built_area_sqft", "bedrooms", "bathrooms", "floor_count", "parking_spaces", "year_built", "furnishing", "condition"],
      ad_details: ["title", "slug", "short_description", "description"],
      price_details: ["price_lkr", "price_on_request", "price_unit", "is_negotiable", "rent_period", "minimum_lease_months", "advance_months", "deposit_lkr"],
      features: ["has_electricity", "water_source", "deed_type", "deed_note", ...Object.keys(empty.features)],
      media_seo: ["cover_image", "video_url", "google_drive_url", "gallery", "meta_title", "meta_description"],
      documents: ["documents"]
    };
    if (!sectionFields[section]) return fullPayload;

    const partial: Record<string, any> = {};
    sectionFields[section].forEach(key => {
      partial[key] = (fullPayload as any)[key];
    });
    return partial;
  }


  function toPayload() {
    const PROVINCE_MAP: Record<string, number> = {
      "Western": 1, "Central": 2, "Southern": 3, "Northern": 4, "Eastern": 5,
      "North Western": 6, "North Central": 7, "Uva": 8, "Sabaragamuwa": 9
    };
    const DISTRICT_MAP: Record<string, number> = {
      "Colombo": 1, "Gampaha": 2, "Kalutara": 3,
      "Kandy": 4, "Matale": 5, "Nuwara Eliya": 6,
      "Galle": 7, "Matara": 8, "Hambantota": 9,
      "Jaffna": 10, "Kilinochchi": 11, "Mannar": 12, "Vavuniya": 13, "Mullaitivu": 14,
      "Batticaloa": 15, "Ampara": 16, "Trincomalee": 17,
      "Kurunegala": 18, "Puttalam": 19,
      "Anuradhapura": 20, "Polonnaruwa": 21,
      "Badulla": 22, "Moneragala": 23,
      "Ratnapura": 24, "Kegalle": 25
    };
    return {

      title: values.title,
      slug: values.slug,
      category: values.category,
      listing_type: values.listing_type,
      short_description: values.short_description,
      description: values.description,
      price_lkr: values.price_on_request ? null : (values.price_lkr ? Number(values.price_lkr) : null),
      price_on_request: values.price_on_request,
      price_unit: values.price_on_request ? null : (values.price_unit || null),
      is_negotiable: values.is_negotiable,
      rent_period: values.listing_type === "RENT" ? values.rent_period : null,
      minimum_lease_months: values.listing_type === "RENT" && values.minimum_lease_months ? Number(values.minimum_lease_months) : null,
      advance_months: values.advance_months ? Number(values.advance_months) : null,
      deposit_lkr: values.deposit_lkr ? Number(values.deposit_lkr) : null,
      province_id: PROVINCE_MAP[values.province] || 1,
      district_id: DISTRICT_MAP[values.district] || 1,
      city: values.city,
      address_line: values.address_line,
      map_url: values.map_url,
      latitude: Number(values.latitude),
      longitude: Number(values.longitude),
      show_exact_location: values.show_exact_location,

      land_area_unit: values.land_area_unit,
      land_area_count: values.land_area_count ? Number(values.land_area_count) : null,
      road_access: values.road_access,
      road_width_ft: values.road_access && values.road_width_ft ? Number(values.road_width_ft) : null,
      road_surface: values.road_access ? (values.road_surface || null) : null,
      land_shape: values.land_shape || null,
      frontage_ft: values.frontage_ft ? Number(values.frontage_ft) : null,
      land_type: values.land_type || null,

      built_area_sqft: values.category !== "LAND" && values.built_area_sqft ? Number(values.built_area_sqft) : null,
      bedrooms: values.bedrooms ? Number(values.bedrooms) : null,
      bathrooms: values.bathrooms ? Number(values.bathrooms) : null,
      floor_count: values.floor_count ? Number(values.floor_count) : null,
      parking_spaces: values.parking_spaces ? Number(values.parking_spaces) : null,
      year_built: values.year_built ? Number(values.year_built) : null,
      furnishing: values.furnishing || null,
      condition: values.condition || null,

      is_featured: values.is_featured,
      has_electricity: values.has_electricity || null,
      water_source: values.water_source || null,
      deed_type: values.deed_type || null,
      deed_note: values.deed_note || null,
      ...values.features,
      cover_image: values.cover_image,
      video_url: values.video_url,
      google_drive_url: values.google_drive_url,
      gallery: values.gallery,
      meta_title: values.meta_title,
      meta_description: values.meta_description,
      documents: values.documents.map(doc => ({
        ...doc,
        type: doc.document_type,
        document_type: undefined
      })),
    };
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setFieldErrors({});

    const required = [
      { key: "category", name: "Property Type" },
      { key: "listing_type", name: "Listing Type" },
      { key: "province", name: "Province" },
      { key: "district", name: "District" },
      { key: "city", name: "City / Town" },
      { key: "title", name: "Title" },
      { key: "slug", name: "Slug" },
      { key: "short_description", name: "Short Description" },
      { key: "description", name: "Description" },
    ];
    let missing: string[] = [];
    for (const req of required) {
      if (!values[req.key as keyof PropertyFormValues]) {
        missing.push(req.name);
      }
    }
    if (!values.price_on_request) {
      if (!values.price_lkr) missing.push("Price (LKR)");
      if (!values.price_unit) missing.push("Price Unit");
    }
    if (missing.length > 0) {
      const msg = `Please fill in all required fields: ${missing.join(", ")}`;
      setError(msg);
      showToast(msg, "error");
      setSaving(false);
      return;
    }

    const lat = Number(values.latitude);
    const lng = Number(values.longitude);
    if (isNaN(lat) || lat < 5.9 || lat > 9.9 || isNaN(lng) || lng < 79.5 || lng > 81.9) {
      const msg = "Invalid location. Latitude must be between 5.9 and 9.9, and Longitude between 79.5 and 81.9 (Sri Lanka).";
      setError(msg);
      showToast(msg, "error");
      setSaving(false);
      setStep(1);
      return;
    }

    try {
      if (propertyId) {
        await adminJSON(`/properties/${propertyId}`, { method: "PATCH", body: JSON.stringify(toPayload()) });
        showToast("Property updated successfully!", "success");
        setTimeout(() => router.push("/admin/properties"), 1000);
      } else {
        const res = await adminJSON<{ id: string }>("/properties", { method: "POST", body: JSON.stringify(toPayload()) });
        showToast("Draft created successfully!", "success");
        setTimeout(() => router.push(`/admin/properties/${res.id}/edit`), 1000);
      }
    } catch (err: any) {
      let msg = err.message || "Failed to save property";
      if (msg.includes("chk_latlng")) {
        msg = "Invalid location. Latitude must be between 5.9 and 9.9, and Longitude between 79.5 and 81.9 (Sri Lanka).";
      }
      setError(msg);
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  function getCurrentLocation() {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition((position) => {
        set("latitude", position.coords.latitude.toString());
        set("longitude", position.coords.longitude.toString());
        showToast("Location updated", "success");
      }, () => showToast("Could not access your location. Please check browser permissions."));
    } else {
      showToast("Geolocation is not supported by your browser");
    }
  }

  const getRefCode = (category: string, listingType: string, id: string | undefined) => {
    if (id && initial?.reference_code) return initial.reference_code;
    const catPrefix: Record<string, string> = {
      LAND: "L",
      HOUSE: "H",
      COMMERCIAL: "C",
      OTHER: "O",
    };
    const listPrefix: Record<string, string> = {
      SALE: "S",
      RENT: "R",
    };
    return `DHR-${catPrefix[category] || "O"}${listPrefix[listingType] || "S"}-(Auto)`;
  };

  return (
    <>
      {confirmModal && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="bg-white border border-stone-200 p-6 rounded-xl shadow-2xl w-[400px] max-w-[90vw] animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-medium text-ink mb-6">{confirmModal.message}</h3>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmModal(null)}
                className="px-5 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmModal.onConfirm();
                  setConfirmModal(null);
                }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {confirmModal.confirmText || "Yes"}
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className={`fixed z-[9999] px-6 py-3 shadow-xl rounded-sm text-sm font-medium transition-all animate-in fade-in ${
          toast.type === 'center-info'
            ? 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-lg px-8 py-4'
            : 'top-4 right-4 slide-in-from-top-4 ' + (toast.type === 'error' ? 'bg-red-600 text-white' : 'bg-[#2B8B45] text-white')
        }`}>
          {toast.msg}
        </div>
      )}
      <form onSubmit={onSubmit} className="max-w-6xl space-y-8 text-sm" noValidate>
        {error && <div className="border border-red-300 bg-red-50 p-3 text-red-700">{error}</div>}

        {/* STEPPER */}
        <div className="flex items-center justify-between mb-8 relative px-4">
          <div className="absolute top-1/2 left-4 right-4 h-[2px] bg-stone-300 z-0 -translate-y-1/2"></div>
          {[1, 2, 3].map((s) => (
            <button type="button" onClick={() => setStep(s)} key={s} className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full font-medium transition-transform hover:scale-110 ${step > s ? 'bg-[#2B8B45] text-white' : step === s ? 'bg-[#333333] text-white' : 'bg-white border-2 border-stone-200 text-stone-400 hover:border-stone-400'}`}>
              {step > s ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
              ) : s}
            </button>
          ))}
        </div>

        {/* STEP 1: Basic Info & Location */}
        <div className={step === 1 ? 'block' : 'hidden'}>
          <Section id="property_type" title="Property Type & Listing" propertyId={propertyId} isEditing={editingSections["property_type"]} saving={saving} toggleEdit={toggleEdit}>
            <div className="grid gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-soft">Property Type *</span>
                <select value={values.category} onChange={(e) => set("category", e.target.value as any)} className="w-full border border-stone-line px-3 py-2.5">
                  <option value="LAND">Lands</option>
                  <option value="HOUSE">Houses</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="OTHER">Other</option>
                </select>
                <div className="mt-2 text-xs text-ink-soft font-mono bg-stone-100 p-2 border border-stone-line inline-block">
                  Reference Code: {getRefCode(values.category, values.listing_type, propertyId)}
                </div>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-soft">Listing Type *</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="listing_type" value="SALE" checked={values.listing_type === 'SALE'} onChange={() => set('listing_type', 'SALE')} className="w-4 h-4 text-green-600" />
                    <span>Sale</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="listing_type" value="RENT" checked={values.listing_type === 'RENT'} onChange={() => set('listing_type', 'RENT')} className="w-4 h-4 text-green-600" />
                    <span>Rent</span>
                  </label>
                </div>
              </label>
            </div>
          </Section>

          <Section id="location" title="Location and Map" propertyId={propertyId} isEditing={editingSections["location"]} saving={saving} toggleEdit={toggleEdit}>

            <div className="grid gap-6 sm:grid-cols-3 mb-6">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-soft">Province *</span>
                <select
                  value={values.province}
                  onChange={(e) => {
                    set("province", e.target.value);
                    set("district", ""); // Reset district when province changes
                  }}
                  className="w-full border border-stone-line px-3 py-2.5"
                >
                  <option value="" disabled>Select Province</option>
                  {Object.keys(PROVINCE_DISTRICTS).sort().map(p => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-soft">District *</span>
                <select
                  value={values.district}
                  onChange={(e) => {
                    const d = e.target.value;
                    set("district", d);
                    if (!values.show_exact_location && DISTRICT_COORDS[d]) {
                      set("latitude", DISTRICT_COORDS[d].lat);
                      set("longitude", DISTRICT_COORDS[d].lng);
                    }
                  }}
                  className="w-full border border-stone-line px-3 py-2.5"
                  disabled={!values.province}
                >
                  <option value="" disabled>Select District</option>
                  {(PROVINCE_DISTRICTS[values.province] || []).map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-soft">City / Town *</span>
                <input
                  type="text"
                  placeholder="E.g. Panadura"
                  value={values.city}
                  onChange={(e) => set("city", e.target.value)}
                  className="w-full border border-stone-line px-3 py-2.5"
                />
              </label>
            </div>

            <div className="grid gap-6 sm:grid-cols-1 mb-6">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-ink-soft">Address Line</span>
                <input
                  placeholder="E.g. 123 Park Road"
                  value={values.address_line}
                  onChange={(e) => set("address_line", e.target.value)}
                  className="w-full border border-stone-line px-3 py-2.5"
                />
              </label>
            </div>

            <div className="mb-6">
              <label className="block mb-4">
                <span className="mb-2 block text-sm font-medium text-ink-soft">Google Maps Link (Optional)</span>
                <input
                  placeholder="https://maps.app.goo.gl/..."
                  type="text"
                  value={values.map_url}
                  onChange={(e) => set("map_url", e.target.value)}
                  className="w-full border border-stone-line px-3 py-2"
                />
              </label>
              <LocationMap
                lat={Number(values.latitude) || 7.0}
                lng={Number(values.longitude) || 80.0}
                readOnly={!values.show_exact_location}
                onChange={(lat, lng) => {
                  set("latitude", lat.toString());
                  set("longitude", lng.toString());
                }}
              />
            </div>

            <div className="grid gap-6 sm:grid-cols-4 items-end">
              <button
                type="button"
                onClick={() => {
                  const newShowExact = !values.show_exact_location;
                  set("show_exact_location", newShowExact);
                  if (!newShowExact && values.district && DISTRICT_COORDS[values.district]) {
                    set("latitude", DISTRICT_COORDS[values.district].lat);
                    set("longitude", DISTRICT_COORDS[values.district].lng);
                  }
                }}
                className={`w-full border px-3 py-2 flex items-center justify-center gap-2 font-medium transition-colors ${values.show_exact_location
                    ? 'bg-[#2B8B45] border-[#2B8B45] text-white'
                    : 'bg-white border-stone-line text-stone-500 hover:bg-stone-50'
                  }`}
              >
                📍 Show Exact Location
              </button>

              {values.show_exact_location && (
                <>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-ink-soft">Latitude</span>
                    <input value={values.latitude} onChange={(e) => set("latitude", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-medium text-ink-soft">Longitude</span>
                    <input value={values.longitude} onChange={(e) => set("longitude", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <button
                    type="button"
                    onClick={getCurrentLocation}
                    className="w-full border border-stone-line bg-white px-3 py-2 flex items-center justify-center gap-2 hover:bg-stone-50"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" /></svg>
                    GET LOCATION
                  </button>
                </>
              )}
            </div>
          </Section>

          <div className="mt-8 flex justify-end">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="bg-[#2B8B45] text-white px-8 py-2.5 rounded-sm hover:bg-green-700 font-medium"
            >
              CONTINUE →
            </button>
          </div>
        </div>

        {/* STEP 2: The rest of the fields (Hidden in Step 1) */}
        <div className={step === 2 ? 'block' : 'hidden'}>

          {/* DETAILS SECTION */}
          <Section id="property_details" title={values.category === 'LAND' ? 'Land Details' : 'Property Details'} propertyId={propertyId} isEditing={editingSections["property_details"]} saving={saving} toggleEdit={toggleEdit}>
            <div className="grid gap-4 sm:grid-cols-3 mb-4">

              {values.category !== 'LAND' && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Bedrooms</span>
                    <input type="number" min="0" value={values.bedrooms} onChange={(e) => set("bedrooms", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Bathrooms</span>
                    <input type="number" min="0" value={values.bathrooms} onChange={(e) => set("bathrooms", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Floor Count</span>
                    <input type="number" min="1" value={values.floor_count} onChange={(e) => set("floor_count", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Parking Spaces</span>
                    <input type="number" min="0" value={values.parking_spaces} onChange={(e) => set("parking_spaces", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                </>
              )}

              <label className="block sm:col-span-1">
                <span className="mb-1 block text-xs text-ink-soft">Size of Land Area</span>
                <div className="flex gap-2">
                  <input type="number" step="0.1" min="0" placeholder="Count" value={values.land_area_count} onChange={(e) => set("land_area_count", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  <select value={values.land_area_unit} onChange={(e) => set("land_area_unit", e.target.value as any)} className="w-24 border border-stone-line px-2 py-2 text-xs">
                    <option value="PERCHES">Perches</option>
                    <option value="ACRES">Acres</option>
                  </select>
                </div>
              </label>

              {values.category !== 'LAND' && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Floor Area (Sq ft)</span>
                    <input type="number" min="0" value={values.built_area_sqft} onChange={(e) => set("built_area_sqft", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block relative group">
                    <span className="mb-1 block text-xs text-ink-soft">Year Built</span>
                    <input type="number" min="1800" max={new Date().getFullYear()} value={values.year_built} onChange={(e) => set("year_built", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                    {values.year_built && (
                      <span className="text-xs text-stone-500 absolute right-3 top-8">{new Date().getFullYear() - parseInt(values.year_built)} yrs</span>
                    )}
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Furnishing</span>
                    <select value={values.furnishing} onChange={(e) => set("furnishing", e.target.value as any)} className="w-full border border-stone-line px-3 py-2 text-sm">
                      <option value="" disabled>Select</option>
                      <option value="UNFURNISHED">Unfurnished</option>
                      <option value="SEMI_FURNISHED">Semi Furnished</option>
                      <option value="FULLY_FURNISHED">Fully Furnished</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Condition</span>
                    <select value={values.condition} onChange={(e) => set("condition", e.target.value as any)} className="w-full border border-stone-line px-3 py-2 text-sm">
                      <option value="" disabled>Select</option>
                      <option value="NEW">New</option>
                      <option value="USED">Used</option>
                      <option value="SEMI_FINISHED">Semi Finished</option>
                      <option value="UNDER_CONSTRUCTION">Under Construction</option>
                    </select>
                  </label>
                </>
              )}

              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Land Shape</span>
                <select value={values.land_shape} onChange={(e) => set("land_shape", e.target.value as any)} className="w-full border border-stone-line px-3 py-2 text-sm">
                  <option value="" disabled>Select</option>
                  <option value="RECTANGULAR">Rectangular</option>
                  <option value="SQUARE">Square</option>
                  <option value="TRIANGULAR">Triangular</option>
                  <option value="IRREGULAR">Irregular</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Frontage (ft)</span>
                <input type="number" min="0" value={values.frontage_ft} onChange={(e) => set("frontage_ft", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
              </label>

              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Land Type</span>
                <select value={values.land_type} onChange={(e) => set("land_type", e.target.value as any)} className="w-full border border-stone-line px-3 py-2 text-sm">
                  <option value="" disabled>Select</option>
                  <option value="RESIDENTIAL">Residential</option>
                  <option value="AGRICULTURAL">Agricultural</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="INDUSTRIAL">Industrial</option>
                </select>
              </label>

            </div>

            <div className="border-t border-stone-line pt-4 mt-2">
              <button
                type="button"
                onClick={() => set("road_access", !values.road_access)}
                className={`flex items-center gap-2 px-4 py-2 mb-4 border text-sm font-medium transition-colors w-fit ${values.road_access ? 'bg-[#2B8B45] border-[#2B8B45] text-white' : 'bg-white border-stone-line text-ink-soft hover:bg-stone-50'}`}
              >
                🛣️ Property has road access
              </button>
              {values.road_access && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Road Width (ft)</span>
                    <input type="number" min="0" value={values.road_width_ft} onChange={(e) => set("road_width_ft", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Road Surface</span>
                    <select value={values.road_surface} onChange={(e) => set("road_surface", e.target.value as any)} className="w-full border border-stone-line px-3 py-2 text-sm">
                      <option value="" disabled>Select</option>
                      <option value="CARPETED">Carpeted</option>
                      <option value="CONCRETE">Concrete</option>
                      <option value="GRAVEL">Gravel</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </label>
                </div>
              )}
            </div>
          </Section>

          {/* AD DETAILS SECTION */}
          <Section id="ad_details" title="Ad Details" propertyId={propertyId} isEditing={editingSections["ad_details"]} saving={saving} toggleEdit={toggleEdit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-soft">Title *</span>
                <input maxLength={100} value={values.title} onChange={(e) => {
                  const newTitle = e.target.value;
                  set("title", newTitle);
                  // Auto generate slug
                  const newSlug = newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
                  set("slug", newSlug);
                }} className="w-full border border-stone-line px-3 py-2" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-soft">Slug (Unique Auto-generated) *</span>
                <input value={values.slug} onChange={(e) => set("slug", e.target.value)} className="w-full border border-stone-line px-3 py-2 font-mono text-xs bg-stone-50" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-soft">Short Description (max 160 chars Display for the small Cards) *</span>
                <textarea maxLength={160} rows={2} value={values.short_description} onChange={(e) => set("short_description", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-soft">Description *</span>
                <textarea rows={5} value={values.description} onChange={(e) => set("description", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
              </label>
            </div>
          </Section>

          {/* PRICE DETAILS SECTION */}
          <Section id="price_details" title="Price Details" propertyId={propertyId} isEditing={editingSections["price_details"]} saving={saving} toggleEdit={toggleEdit}>

            <div className="flex gap-4 mb-6">
              <button
                type="button"
                onClick={() => set("price_on_request", !values.price_on_request)}
                className={`px-4 py-2 border text-sm font-medium transition-colors ${values.price_on_request ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-white border-stone-line text-ink-soft'}`}
              >
                📞 Price on Request
              </button>
              <button
                type="button"
                onClick={() => set("is_negotiable", !values.is_negotiable)}
                className={`px-4 py-2 border text-sm font-medium transition-colors ${values.is_negotiable ? 'bg-green-100 border-green-300 text-green-800' : 'bg-white border-stone-line text-ink-soft'}`}
              >
                🤝 Negotiable
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {!values.price_on_request && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Price (LKR)</span>
                    <input type="number" min={1} value={values.price_lkr} onChange={(e) => set("price_lkr", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Price Unit</span>
                    <select value={values.price_unit} onChange={(e) => set("price_unit", e.target.value)} className="w-full border border-stone-line px-3 py-2">
                      <option value="TOTAL">Total</option>
                      <option value="PER_PERCH">Per Perch</option>
                      <option value="PER_MONTH">Per Month</option>
                      <option value="PER_YEAR">Per Year</option>
                    </select>
                  </label>
                </>
              )}

              {values.listing_type === "RENT" && (
                <>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Rent Period</span>
                    <select value={values.rent_period} onChange={(e) => set("rent_period", e.target.value)} className="w-full border border-stone-line px-3 py-2">
                      <option value="MONTHLY">Monthly</option>
                      <option value="ANNUAL">Annual</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Minimum Lease (Months)</span>
                    <input type="number" min="1" value={values.minimum_lease_months} onChange={(e) => set("minimum_lease_months", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Advance (months)</span>
                    <input type="number" value={values.advance_months} onChange={(e) => set("advance_months", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                  <label className="block">
                    <span className="mb-1 block text-xs text-ink-soft">Refundable Deposit (LKR)</span>
                    <input type="number" value={values.deposit_lkr} onChange={(e) => set("deposit_lkr", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
                  </label>
                </>
              )}
            </div>
          </Section>

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="border border-stone-line bg-white px-8 py-2.5 hover:bg-stone-50 font-medium"
            >
              ← BACK
            </button>
            <button
              type="button"
              onClick={() => setStep(3)}
              className="bg-[#2B8B45] text-white px-8 py-2.5 rounded-sm hover:bg-green-700 font-medium"
            >
              CONTINUE →
            </button>
          </div>
        </div>

        {/* STEP 3: Features & Media */}
        <div className={step === 3 ? 'block' : 'hidden'}>

          <Section id="features" title="Property Features" propertyId={propertyId} isEditing={editingSections["features"]} saving={saving} toggleEdit={toggleEdit}>

            <div className="grid gap-4 sm:grid-cols-2 mb-6">
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Electricity</span>
                <select value={values.has_electricity} onChange={(e) => set("has_electricity", e.target.value as any)} className="w-full border border-stone-line px-3 py-2 text-sm">
                  <option value="" disabled>Select</option>
                  <option value="3_PHASE">Three-Phase</option>
                  <option value="SINGLE_PHASE">Single Phase</option>
                  <option value="NONE">None</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Water Source</span>
                <select value={values.water_source} onChange={(e) => set("water_source", e.target.value as any)} className="w-full border border-stone-line px-3 py-2 text-sm">
                  <option value="" disabled>Select</option>
                  <option value="MAINS">Mains</option>
                  <option value="WELL">Well</option>
                  <option value="BOTH">Both</option>
                  <option value="NONE">None</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1 block text-xs text-ink-soft">Deed Type</span>
                <select value={values.deed_type} onChange={(e) => set("deed_type", e.target.value as any)} className="w-full border border-stone-line px-3 py-2 text-sm">
                  <option value="" disabled>Select</option>
                  <option value="CLEAR_DEED">Clear Deed</option>
                  <option value="BIM_SAVIYA">Bim Saviya</option>
                  <option value="LEASEHOLD">Leasehold</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-soft">Deed Note</span>
                <textarea maxLength={300} rows={2} value={values.deed_note} onChange={(e) => set("deed_note", e.target.value)} className="w-full border border-stone-line px-3 py-2" />
              </label>
            </div>

            <h3 className="mb-3 block text-sm font-medium text-ink-soft">Additional Features</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {Object.keys(empty.features).map((featKey) => {
                const iconMap: Record<string, string> = {
                  has_boundary_wall: "🧱", has_solar: "☀️", ac_ready: "❄️", beachfront_sea_view: "🌊", waterfront_riverside: "🛶",
                  hillside: "⛰️", paddy_front: "🌾", lake_front: "🦆", indoor_garden: "🪴", garage: "🚗", swimming_pool: "🏊",
                  gated_community: "⛩️", roof_top_garden: "🌇", lawn_garden: "🌳", luxury_specification: "💎", security_24_hours: "🛡️",
                  colonial_architecture: "🏛️", maids_room: "🛏️", infinity_pool: "🌅", home_security_system: "🚨", maids_toilet: "🚽",
                  hot_water: "🚿", overhead_water_tank: "💧", attached_toilets: "🛁", permits_for_gem_mining: "⛏️", soil_test_passed: "🧪",
                  hilly_landscape: "🏞️", ideal_for_commercial_use: "🏢", lake_pond_inside_land: "🐟", bungalow_cottage_type: "🏡",
                  stream_running_through_land: "〰️", approved_survey_plan: "📐"
                };
                return (
                  <button
                    key={featKey}
                    type="button"
                    onClick={() => setValues(prev => ({ ...prev, features: { ...prev.features, [featKey]: !prev.features[featKey as keyof typeof empty.features] } }))}
                    className={`flex items-center justify-start gap-2 px-4 py-2.5 border text-xs font-medium transition-colors ${values.features[featKey as keyof typeof empty.features] ? 'bg-[#2B8B45] border-[#2B8B45] text-white' : 'bg-white border-stone-line text-ink-soft hover:bg-stone-50'}`}
                  >
                    <span className="text-base">{iconMap[featKey] || "✓"}</span>
                    <span className="text-left">{featKey.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ').replace('Has ', '')}</span>
                  </button>
                );
              })}
            </div>
          </Section>

          <Section id="media_seo" propertyId={propertyId} isEditing={editingSections["media_seo"]} saving={saving} toggleEdit={toggleEdit} title={
            <div className="flex items-center gap-4">
              <span>Media & SEO</span>
              <span className={`text-xs font-medium px-2 py-1 rounded-full ${canPublish ? 'bg-green-100 text-green-700' : 'bg-stone-200 text-stone-600'}`}>
                Images ({totalImages}/3 min) with cover photo to be able publish
              </span>
            </div>
          }>

            <div className="grid gap-6 sm:grid-cols-2 mb-6">
              <div className="block">
                <div className="flex justify-between items-center mb-2">
                  <span className="block text-sm font-medium text-ink-soft">Cover Image</span>
                  {values.cover_image && (
                    <button type="button" onClick={removeCoverImage} className="text-xs text-red-600 hover:underline">Remove</button>
                  )}
                </div>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-line bg-stone-50 h-32 cursor-pointer hover:bg-stone-100 overflow-hidden relative">
                  {values.cover_image ? (
                    <img src={values.cover_image} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm text-stone-500">Click to upload cover image</span>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, "cover_image", false)} />
                </label>
              </div>

              <div className="block">
                <div className="flex justify-between items-center mb-2">
                  <span className="block text-sm font-medium text-ink-soft">Gallery Images</span>
                </div>
                <label className="flex flex-col items-center justify-center border-2 border-dashed border-stone-line bg-stone-50 h-32 cursor-pointer hover:bg-stone-100 mb-2">
                  <span className="text-sm text-stone-500">Click to upload multiple images</span>
                  <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e, "gallery", true)} />
                </label>

                {values.gallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-2">
                    {values.gallery.map((img, i) => (
                      <div key={i} className="relative border border-stone-line bg-white p-2">
                        <div className="relative aspect-square bg-stone-50 mb-2">
                          <img src={img.url} alt={`Gallery ${i + 1}`} className="w-full h-full object-cover" />
                          <button type="button" onClick={() => removeGalleryImage(i)} className="absolute top-1 right-1 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs hover:bg-red-700 shadow">✕</button>
                        </div>
                        <input
                          type="text"
                          placeholder="Caption (Max 25 chars)"
                          maxLength={25}
                          value={img.caption}
                          onChange={(e) => {
                            const newGallery = [...values.gallery];
                            newGallery[i].caption = e.target.value;
                            set("gallery", newGallery);
                          }}
                          className="w-full border border-stone-line px-2 py-1 text-xs"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <label className="block mb-4">
              <span className="mb-1 block text-xs text-ink-soft">Google Drive URL (For additional media) <span className="text-stone-400 font-normal">(Optional)</span></span>
              <input value={values.google_drive_url} onChange={(e) => set("google_drive_url", e.target.value)} placeholder="https://drive.google.com/drive/folders/..." className="w-full border border-stone-line px-3 py-2" />
            </label>

            <label className="block mb-6">
              <span className="mb-1 block text-xs text-ink-soft">Video URL (YouTube/Vimeo) <span className="text-stone-400 font-normal">(Optional)</span></span>
              <input value={values.video_url} onChange={(e) => set("video_url", e.target.value)} placeholder="https://youtube.com/..." className="w-full border border-stone-line px-3 py-2" />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-soft">Meta Title (SEO) - Falls back to main title</span>
                <input maxLength={100} value={values.meta_title} onChange={(e) => set("meta_title", e.target.value)} placeholder={values.title} className="w-full border border-stone-line px-3 py-2 bg-stone-50" />
              </label>
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs text-ink-soft">Meta Description (SEO) - Falls back to short description</span>
                <textarea maxLength={160} rows={2} value={values.meta_description} onChange={(e) => set("meta_description", e.target.value)} placeholder={values.short_description} className="w-full border border-stone-line px-3 py-2 bg-stone-50" />
              </label>
            </div>
          </Section>

          <Section id="documents" title={
            <div className="flex items-center gap-4">
              <span>Documents (Optional)</span>
              <button type="button" onClick={() => setShowDocForm(!showDocForm)} className="flex items-center gap-1 text-sm font-medium text-[#2B8B45] hover:underline relative z-20 pointer-events-auto">
                {showDocForm ? 'Cancel' : '+ Add Document'}
              </button>
            </div>
          }>

            {showDocForm && (
              <div className="border border-stone-line p-4 bg-stone-50 mb-4 grid gap-4 sm:grid-cols-2">
                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs text-ink-soft">Document Title</span>
                  <input value={docForm.title} onChange={(e) => setDocForm({ ...docForm, title: e.target.value })} placeholder="e.g. Survey Plan" className="w-full border border-stone-line px-3 py-2 bg-white" />
                </label>

                <div className="sm:col-span-2">
                  <span className="mb-1 block text-xs text-ink-soft">Upload Document</span>
                  <label className="inline-block bg-white border border-stone-line px-3 py-2 text-sm cursor-pointer hover:bg-stone-50">
                    Choose File
                    <input type="file" className="hidden" onChange={handleSingleDocumentUpload} />
                  </label>
                  {docForm.file_url.startsWith('data:') && (
                    <span className="ml-3 text-xs text-[#2B8B45]">
                      File attached
                      <button type="button" onClick={() => setDocForm({ ...docForm, file_url: "" })} className="ml-2 text-red-500 hover:underline">Clear</button>
                    </span>
                  )}
                </div>

                <label className="block sm:col-span-2">
                  <span className="mb-1 block text-xs text-ink-soft">OR File URL (Google Drive URL, etc.)</span>
                  <input
                    value={docForm.file_url}
                    onChange={(e) => setDocForm({ ...docForm, file_url: e.target.value })}
                    readOnly={docForm.file_url.startsWith('data:')}
                    placeholder="https://..."
                    className={`w-full border border-stone-line px-3 py-2 ${docForm.file_url.startsWith('data:') ? 'bg-stone-100 text-stone-500 cursor-not-allowed' : 'bg-white'}`}
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-soft">Type</span>
                  <select value={docForm.document_type} onChange={(e) => setDocForm({ ...docForm, document_type: e.target.value as any })} className="w-full border border-stone-line px-3 py-2 bg-white">
                    <option value="SURVEY_PLAN">Survey Plan</option>
                    <option value="FLOOR_PLAN">Floor Plan</option>
                    <option value="BROCHURE">Brochure</option>
                    <option value="APPROVAL">Approval</option>
                    <option value="OTHER">Other</option>
                  </select>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs text-ink-soft">Access</span>
                  <select value={docForm.access} onChange={(e) => setDocForm({ ...docForm, access: e.target.value as any })} className="w-full border border-stone-line px-3 py-2 bg-white">
                    <option value="PUBLIC">Public</option>
                    <option value="GATED">Gated</option>
                    <option value="INTERNAL">Internal</option>
                  </select>
                </label>
                <div className="sm:col-span-2 flex justify-end">
                  <button type="button" onClick={addOrUpdateDocument} className="bg-ink text-white px-4 py-2 text-sm">Save Document</button>
                </div>
              </div>
            )}

            {values.documents.length > 0 && (
              <div className="space-y-2">
                {values.documents.map((doc, i) => (
                  <div key={i} className="p-3 border border-stone-line bg-white">
                    <div className="flex items-center justify-between">
                      <div className="cursor-pointer select-none flex-1" onClick={() => toggleDocExpand(i)}>
                        <div className="font-medium text-sm hover:underline">{doc.title}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{doc.document_type || (doc as any).type} • {doc.access}</div>
                      </div>
                      <div className="flex gap-3">
                        <button type="button" onClick={() => editDocument(i)} className="text-xs text-ink hover:underline">Edit</button>
                        <button type="button" onClick={() => removeDocument(i)} className="text-xs text-red-600 hover:underline">Remove</button>
                      </div>
                    </div>
                    {expandedDocs[i] && (
                      <div className="mt-2 p-3 bg-stone-50 border border-stone-line text-sm break-all">
                        <p className="text-xs text-stone-500 mb-1">File URL:</p>
                        {doc.file_url.startsWith('data:') ? (
                          <a href={doc.file_url} download={doc.title} className="text-[#2B8B45] hover:underline" target="_blank" rel="noopener noreferrer">
                            [Download/View Uploaded File]
                          </a>
                        ) : (
                          <a href={doc.file_url} className="text-[#2B8B45] hover:underline" target="_blank" rel="noopener noreferrer">
                            {doc.file_url}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Section>

          <div className="mt-8 flex justify-between">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="border border-stone-line bg-white px-8 py-2.5 hover:bg-stone-50 font-medium"
            >
              ← BACK
            </button>
            {!propertyId ? (
              <button type="submit" disabled={saving} className="bg-ink px-8 py-2.5 text-white hover:bg-ink-light disabled:opacity-50">
                {saving ? "Saving..." : "Create Draft"}
              </button>
            ) : (
              <button type="button" onClick={() => router.push("/admin/properties")} className="bg-ink px-8 py-2.5 text-white hover:bg-ink-light">
                Done (Return to List)
              </button>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
