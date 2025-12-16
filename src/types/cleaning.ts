
export interface ChecklistSubsection {
    title: string;
    items: string[];
}

export interface ChecklistSection {
    title: string;
    badge?: string;
    description?: string;
    items?: string[];
    subsections?: ChecklistSubsection[];
    footer?: string;
}

export interface ChecklistProfile {
    slug: string;
    locationLabel: string;
    heroImage: string;
    heroAlt: string;
    title: string;
    summary: string;
    chips: string[];
    sections: ChecklistSection[];
}
