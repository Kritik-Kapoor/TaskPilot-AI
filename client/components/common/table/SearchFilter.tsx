import { Input } from "@/components/ui/input";

interface SearchFilterProps {
  value: string;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
}

const SearchFilter = ({
  value,
  onChange,
  placeholder = "Search...",
}: SearchFilterProps) => {
  return (
    <div className="flex items-center py-4 ml-0.5">
      <Input
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="max-w-sm"
      />
    </div>
  );
};

export default SearchFilter;
