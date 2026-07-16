import { X } from "lucide-react";

const clothingSizes = [
  { size: "XS", chest: "80-84 cm", waist: "60-64 cm", hips: "86-90 cm", us: "0-2", eu: "32-34" },
  { size: "S", chest: "84-88 cm", waist: "64-68 cm", hips: "90-94 cm", us: "4-6", eu: "36-38" },
  { size: "M", chest: "88-92 cm", waist: "68-72 cm", hips: "94-98 cm", us: "8-10", eu: "40-42" },
  { size: "L", chest: "92-96 cm", waist: "72-76 cm", hips: "98-102 cm", us: "12-14", eu: "44-46" },
  { size: "XL", chest: "96-100 cm", waist: "76-80 cm", hips: "102-106 cm", us: "16-18", eu: "48-50" },
];

const shoeSizes = [
  { eu: "36", us: "6", uk: "3.5", cm: "23" },
  { eu: "37", us: "7", uk: "4.5", cm: "23.5" },
  { eu: "38", us: "7.5", uk: "5", cm: "24.5" },
  { eu: "39", us: "8.5", uk: "6", cm: "25" },
  { eu: "40", us: "9", uk: "6.5", cm: "25.5" },
  { eu: "41", us: "10", uk: "7.5", cm: "26.5" },
  { eu: "42", us: "9", uk: "8", cm: "27" },
  { eu: "43", us: "10", uk: "9", cm: "28" },
  { eu: "44", us: "11", uk: "10", cm: "29" },
  { eu: "45", us: "12", uk: "11", cm: "30" },
];

export default function SizeGuide({ open, onClose, type = "clothing" }) {
  if (!open) return null;

  const isShoe = type === "shoe";
  const data = isShoe ? shoeSizes : clothingSizes;

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center px-4" onClick={onClose}>
      <div className="bg-background border border-border w-full max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div>
            <h2 className="font-serif text-2xl">Size Guide</h2>
            <p className="text-[11px] text-muted-foreground mt-1">{isShoe ? "Footwear sizes" : "Clothing sizes"} — All measurements in centimeters</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center hover:bg-secondary transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {isShoe ? (
                  <>
                    <th className="text-left py-3 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground">EU</th>
                    <th className="text-left py-3 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground">US</th>
                    <th className="text-left py-3 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground">UK</th>
                    <th className="text-left py-3 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground">CM</th>
                  </>
                ) : (
                  <>
                    <th className="text-left py-3 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground">Size</th>
                    <th className="text-left py-3 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground">Chest</th>
                    <th className="text-left py-3 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground">Waist</th>
                    <th className="text-left py-3 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground">Hips</th>
                    <th className="text-left py-3 text-[10px] tracking-[0.15em] uppercase font-medium text-muted-foreground">US</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  {isShoe ? (
                    <>
                      <td className="py-3 font-medium">{row.eu}</td>
                      <td className="py-3 text-muted-foreground">{row.us}</td>
                      <td className="py-3 text-muted-foreground">{row.uk}</td>
                      <td className="py-3 text-muted-foreground">{row.cm}</td>
                    </>
                  ) : (
                    <>
                      <td className="py-3 font-medium">{row.size}</td>
                      <td className="py-3 text-muted-foreground">{row.chest}</td>
                      <td className="py-3 text-muted-foreground">{row.waist}</td>
                      <td className="py-3 text-muted-foreground">{row.hips}</td>
                      <td className="py-3 text-muted-foreground">{row.us}</td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-6 p-4 bg-secondary/30 border border-border">
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              <span className="font-medium text-foreground">How to measure:</span>{" "}
              {isShoe
                ? "Measure your foot from heel to toe while standing on a flat surface. Match the length in cm to find your size."
                : "Chest: Measure around the fullest part. Waist: Measure at the narrowest point. Hips: Measure around the widest part."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
