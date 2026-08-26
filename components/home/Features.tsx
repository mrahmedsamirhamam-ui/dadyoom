export default function Features() {
  const features = [
    {
      title: "🤖 اسأل ضاديوم",
      description: "اسأل عن أي كلمة أو جملة وستحصل على شرح ذكي حسب السياق.",
    },
    {
      title: "📚 المناهج العربية",
      description: "تعلم وفق منهج بلدك أو اكتشف مناهج الدول العربية الأخرى.",
    },
    {
      title: "📖 قاموس السياق",
      description: "اعرف معنى الكلمة داخل الجملة، مع المرادفات والأضداد والأمثلة.",
    },
    {
      title: "🎓 أكاديمية المعلمين",
      description: "دورات واستراتيجيات تدريس وورش عمل للمعلمين.",
    },
  ];

  return (
    <section className="max-w-7xl mx-auto py-16 px-6">
      <h2 className="text-4xl font-bold text-center text-teal-700 mb-12">
        ماذا يقدم ضاديوم؟
      </h2>

      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="rounded-2xl shadow-lg p-6 bg-white hover:shadow-xl transition"
          >
            <h3 className="text-2xl font-bold mb-4">
              {feature.title}
            </h3>

            <p className="text-gray-600 leading-8">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
