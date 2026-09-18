import SectionHeading from "@/components/ui/SectionHeading";

const features = [
  {
    icon: "👨‍🍳",
    title: "Freshly Made",
    description: "Prepared fresh to give you the best taste.",
  },
  {
    icon: "❤️",
    title: "Made With Love",
    description: "Every order is prepared with care.",
  },
  {
    icon: "✨",
    title: "Perfect for Everyone",
    description: "A little treat for every occasion.",
  },
];

export default function WhyMunchBiteSection() {
  return (
    <section className="bg-soft-pink py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="flex justify-center mb-12">
          <SectionHeading
            label="Why MunchBite?"
            heading="Made Fresh. Made With Love."
            align="center"
          />
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="flex flex-col items-center gap-4 text-center"
            >
              {/* Icon Circle */}
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-white shadow-sm text-3xl">
                <span role="img" aria-label={feature.title}>
                  {feature.icon}
                </span>
              </div>

              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold text-chocolate">{feature.title}</h3>
                <p className="text-sm text-chocolate/70 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
