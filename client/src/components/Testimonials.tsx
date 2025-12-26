import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  id: string;
  customerName: string;
  customerLocation: string | null;
  vehicleSold: string | null;
  rating: number;
  content: string;
  photoUrl: string | null;
  featured: boolean;
  createdAt: string;
}

export function Testimonials() {
  const { data: testimonials = [] } = useQuery<Testimonial[]>({
    queryKey: ["/api/testimonials/featured"],
    queryFn: async () => {
      const res = await fetch("/api/testimonials/featured");
      if (!res.ok) return [];
      return res.json();
    },
  });

  if (testimonials.length === 0) {
    return null;
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            What Our Clients Say
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Read testimonials from satisfied sellers and buyers who have experienced our premium consignment services.
          </p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <Card key={testimonial.id} className="relative" data-testid={`testimonial-card-${testimonial.id}`}>
              <CardContent className="pt-6">
                <Quote className="absolute top-4 right-4 h-8 w-8 text-primary/20" />
                
                <div className="flex mb-3">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`h-4 w-4 ${i < testimonial.rating ? "text-yellow-500 fill-yellow-500" : "text-gray-300"}`}
                    />
                  ))}
                </div>
                
                <p className="text-muted-foreground mb-4 italic">
                  "{testimonial.content}"
                </p>
                
                <div className="flex items-center gap-3">
                  {testimonial.photoUrl ? (
                    <img
                      src={testimonial.photoUrl}
                      alt={testimonial.customerName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-primary font-semibold">
                        {testimonial.customerName.charAt(0)}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-sm">{testimonial.customerName}</p>
                    {testimonial.customerLocation && (
                      <p className="text-xs text-muted-foreground">{testimonial.customerLocation}</p>
                    )}
                    {testimonial.vehicleSold && (
                      <p className="text-xs text-primary">{testimonial.vehicleSold}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
