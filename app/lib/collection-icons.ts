/**
 * Maps a collection to a Lucide icon by matching its title and handle
 * against common product category keywords. Falls back to `Archive`
 * when no category pattern matches.
 */
import type {LucideIcon} from "lucide-react";
import {
    Archive,
    Baby,
    Book,
    Car,
    Footprints,
    Gamepad2,
    Gem,
    Glasses,
    Heart,
    Home,
    Music,
    Palette,
    Shirt,
    ShoppingCart,
    Smartphone,
    Sparkles,
    Trophy,
    UtensilsCrossed,
    Watch
} from "lucide-react";

type CollectionCardData = {
    title: string;
    handle: string;
};

export const getCollectionIcon = (collection: CollectionCardData): LucideIcon => {
    const title = collection.title.toLowerCase();
    const handle = collection.handle.toLowerCase();
    const searchText = `${title} ${handle}`.toLowerCase();

    if (
        searchText.includes("clothing") ||
        searchText.includes("apparel") ||
        searchText.includes("shirt") ||
        searchText.includes("dress") ||
        searchText.includes("fashion")
    ) {
        return Shirt;
    }
    if (searchText.includes("accessories") || searchText.includes("watch") || searchText.includes("belt")) {
        return Watch;
    }
    if (
        searchText.includes("jewelry") ||
        searchText.includes("ring") ||
        searchText.includes("necklace") ||
        searchText.includes("bracelet")
    ) {
        return Gem;
    }
    if (
        searchText.includes("shoes") ||
        searchText.includes("boots") ||
        searchText.includes("sneakers") ||
        searchText.includes("footwear")
    ) {
        return Footprints;
    }
    if (
        searchText.includes("bag") ||
        searchText.includes("handbag") ||
        searchText.includes("purse") ||
        searchText.includes("backpack")
    ) {
        return ShoppingCart;
    }
    if (searchText.includes("glasses") || searchText.includes("sunglasses") || searchText.includes("eyewear")) {
        return Glasses;
    }

    if (
        searchText.includes("electronics") ||
        searchText.includes("phone") ||
        searchText.includes("smartphone") ||
        searchText.includes("tech")
    ) {
        return Smartphone;
    }

    if (
        searchText.includes("home") ||
        searchText.includes("furniture") ||
        searchText.includes("decor") ||
        searchText.includes("kitchen")
    ) {
        return Home;
    }

    if (
        searchText.includes("beauty") ||
        searchText.includes("makeup") ||
        searchText.includes("cosmetics") ||
        searchText.includes("skincare")
    ) {
        return Sparkles;
    }
    if (searchText.includes("health") || searchText.includes("wellness") || searchText.includes("fitness")) {
        return Heart;
    }

    if (
        searchText.includes("sports") ||
        searchText.includes("fitness") ||
        searchText.includes("athletic") ||
        searchText.includes("gym")
    ) {
        return Trophy;
    }

    if (searchText.includes("books") || searchText.includes("reading") || searchText.includes("literature")) {
        return Book;
    }
    if (searchText.includes("games") || searchText.includes("gaming") || searchText.includes("toys")) {
        return Gamepad2;
    }
    if (searchText.includes("music") || searchText.includes("audio") || searchText.includes("headphones")) {
        return Music;
    }

    if (
        searchText.includes("food") ||
        searchText.includes("kitchen") ||
        searchText.includes("dining") ||
        searchText.includes("beverage")
    ) {
        return UtensilsCrossed;
    }

    if (
        searchText.includes("baby") ||
        searchText.includes("kids") ||
        searchText.includes("children") ||
        searchText.includes("infant")
    ) {
        return Baby;
    }

    if (
        searchText.includes("car") ||
        searchText.includes("automotive") ||
        searchText.includes("vehicle") ||
        searchText.includes("auto")
    ) {
        return Car;
    }

    if (
        searchText.includes("art") ||
        searchText.includes("design") ||
        searchText.includes("craft") ||
        searchText.includes("creative")
    ) {
        return Palette;
    }

    return Archive;
};
