import { Metadata, ResolvingMetadata } from "next";
import { createClient } from "@/lib/supabase/server";
import ListingClient from "./ListingClient";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata(
  { params }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: item } = await supabase
    .from("listing")
    .select("title, description, brand, department, price, images")
    .eq("id", id)
    .single();

  if (!item) {
    return {
      title: "Item Not Found | Curio",
    };
  }

  // Parse images if needed
  let imageArray: string[] = [];
  if (item.images) {
    if (Array.isArray(item.images)) {
      imageArray = item.images;
    } else if (typeof item.images === "string") {
      try {
        imageArray = JSON.parse(item.images);
      } catch (e) {
        imageArray = [item.images];
      }
    }
  }

  const primaryImage = imageArray.length > 0 ? imageArray[0] : "/assets/hero.png";
  const brandDisplay = item.brand ? `${item.brand} ` : "";
  const title = `${item.title} | Curio`;
  const description = `${brandDisplay}${item.department || "Fashion"} available for Rs ${item.price?.toLocaleString()}. ${item.description ? item.description.substring(0, 100) + '...' : ''}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: primaryImage,
          width: 800,
          height: 600,
          alt: item.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [primaryImage],
    },
  };
}

export default function Page({ params }: Props) {
  return <ListingClient params={params} />;
}
