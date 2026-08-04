import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList, ResponsiveContainer } from 'recharts';
import { useLanguage } from '@/lib/i18n/LanguageContext';

const chartData = [
  { year: '2023', value: 130 },
  { year: '2024', value: 160 },
  { year: '2025', value: 195 },
  { year: '2026', value: 235 },
  { year: '2027', value: 290 },
  { year: '2028', value: 355 },
  { year: '2029', value: 430 },
  { year: '2030', value: 530 },
];

function makeLabelFormatter() {
  return (props) => {
    const { x, y, width, value, index } = props;
    const isLast = index === chartData.length - 1;
    const isRed = chartData[index]?.year === '2026';
    const color = isLast ? 'hsl(46 64% 52%)' : isRed ? 'hsl(0 72% 51%)' : 'hsl(150 5% 30%)';
    return (
      <text x={x + width / 2} y={y - 8} textAnchor="middle" fontSize={11} fontWeight={500} fill={color}>
        {value}
      </text>
    );
  };
}

export default function CreatorEconomy() {
  const { t } = useLanguage();

  return (
    <section className="py-20 lg:py-32 bg-background">
      <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
        <div className="max-w-3xl mb-12">
          <h2 className="text-[2.8rem] lg:text-[4.5rem] font-heading font-bold tracking-tight leading-[1.1]">
            {t.creatorEconomy.titlePre}
            <br />
            <span className="font-display italic text-accent font-normal whitespace-nowrap">{t.creatorEconomy.titleAccent}</span>
          </h2>
          <p className="text-muted-foreground mt-5 text-lg max-w-2xl leading-relaxed">{t.creatorEconomy.subtitle}</p>
        </div>

        <div className="bg-card border-2 border-foreground rounded-2xl p-4 sm:p-6 lg:p-10">
          <div className="flex items-center justify-between mb-6">
            <p className="text-2xl tracking-wide text-foreground font-bold" style={{ fontFamily: 'Calibri, "Segoe UI", Arial, sans-serif' }}>{t.creatorEconomy.chartTitle}</p>
          </div>
          <div className="w-full h-[340px] lg:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 30, right: 8, left: 6, bottom: 4 }} barCategoryGap="20%">
                <CartesianGrid horizontal vertical={false} stroke="hsl(60 5% 88%)" strokeDasharray="3 3" />
                <XAxis
                  dataKey="year"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 12, fill: 'hsl(150 5% 30%)' }}
                  tickMargin={12}
                  padding={{ left: 0, right: 10 }}
                />
                <YAxis
                  axisLine={{ stroke: 'hsl(150 5% 30%)', strokeWidth: 1 }}
                  tickLine={false}
                  tick={{ fontSize: 14, fill: 'hsl(150 5% 30%)' }}
                  tickFormatter={(v) => `${v}`}
                  ticks={[0, 200, 400, 600]}
                  label={{ value: t.creatorEconomy.yLabel, angle: -90, position: 'insideLeft', offset: 2, style: { fontSize: 18, fill: 'hsl(150 5% 20%)', textAnchor: 'middle', fontWeight: 700 } }}
                />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={48}>
                  {chartData.map((entry, index) => {
                    let fill = 'hsl(150 7% 6%)';
                    let opacity = 0.85;
                    if (index === chartData.length - 1) { fill = 'hsl(46 64% 52%)'; opacity = 1; }
                    else if (entry.year === '2026') { fill = 'hsl(0 72% 51%)'; opacity = 1; }
                    return <Cell key={`cell-${index}`} fill={fill} fillOpacity={opacity} />;
                  })}
                  <LabelList content={makeLabelFormatter()} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </section>
  );
}
