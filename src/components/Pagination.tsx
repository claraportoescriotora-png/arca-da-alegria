import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-center gap-4 mt-8">
            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="rounded-full w-10 h-10 border-2"
            >
                <ChevronLeft className="w-5 h-5" />
            </Button>

            <span className="font-fredoka font-medium text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>

            <Button
                variant="outline"
                size="icon"
                onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="rounded-full w-10 h-10 border-2"
            >
                <ChevronRight className="w-5 h-5" />
            </Button>
        </div>
    );
}
