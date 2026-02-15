interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
}

export function CategoryTabs({ categories, activeCategory, onCategoryChange }: CategoryTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
      {categories.map(category => (
        <button
          key={category}
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
            activeCategory === category
              ? 'bg-primary text-primary-foreground shadow-md'
              : 'bg-card text-muted-foreground hover:bg-muted'
          }`}
        >
          {category}
        </button>
      ))}
    </div>
  );
}
