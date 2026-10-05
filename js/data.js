/* ============================================================
   MahaNiti — structured content database
   ------------------------------------------------------------
   To add a new episode: append ONE object to MN.entries.
   Every page (Explore, Insights, Sources, Search, Home cards,
   detail pages) is generated from this file. Nothing is hard-coded
   anywhere else.

   Entry fields
     id, title            – unique slug + short passage title
     parva, section       – e.g. "Udyoga Parva", "Section XCV"
     episode, passage     – episode group + the specific passage
     characters[]         – people involved in the passage
     category, categories – primary category + all categories
     themes[]             – free-form tags for the Theme filter
     situation            – SOURCE CONTEXT: what the passage describes (paraphrase)
     decision, outcome    – SOURCE CONTEXT: what is done / what follows (paraphrase)
     excerpt              – optional short quotation (translator's wording) + where
     insight              – DERIVED INSIGHT (MahaNiti interpretation, not a quotation)
     modern_application   – MODERN APPLICATION (interpretation, not in the ancient text)
     source, translator, language, sourceUrl, sourceLinks[]
     precision            – "section" (checked at section level) | "parva" (parva-level only)
     image                – optional openly-licensed visual reference (Wikimedia Commons)
     figures[], scene     – which 3D sculptures / diorama to show on the detail page
   ============================================================ */

window.MN = window.MN || {};

MN.translation = {
  work: "The Mahabharata of Krishna-Dwaipayana Vyasa (English prose translation)",
  translator: "Kisari Mohan Ganguli",
  years: "1883–1896",
  language: "English",
  rights: "Public domain",
  host: "sacred-texts.com (online edition)",
  base: "https://www.sacred-texts.com/hin/"
};

MN.parvas = [
  { id: "adi",     name: "Ādi Parva",      no: 1,  url: "https://www.sacred-texts.com/hin/m01/index.htm" },
  { id: "sabha",   name: "Sabhā Parva",    no: 2,  url: "https://www.sacred-texts.com/hin/m02/index.htm" },
  { id: "udyoga",  name: "Udyoga Parva",   no: 5,  url: "https://www.sacred-texts.com/hin/m05/index.htm" },
  { id: "bhishma", name: "Bhīṣma Parva",   no: 6,  url: "https://www.sacred-texts.com/hin/m06/index.htm" },
  { id: "shanti",  name: "Śānti Parva",    no: 12, url: "https://www.sacred-texts.com/hin/m12/index.htm" }
];

MN.categories = [
  "Strategy", "Ethics", "Leadership", "Diplomacy",
  "Decision Making", "Governance", "Human Behaviour", "Knowledge"
];

MN.categoryBlurb = {
  "Strategy": "Planning, proportion and weighing consequences before acting.",
  "Ethics": "Duty, fairness and the questions raised when stakes are unequal.",
  "Leadership": "Commitment, counsel and the responsibility that comes with authority.",
  "Diplomacy": "Negotiation, mediation and the attempt to avert conflict.",
  "Decision Making": "Choosing under pressure, uncertainty and competing duties.",
  "Governance": "Rule, restraint and the conduct of a king towards his people.",
  "Human Behaviour": "Envy, pride, anger and why good counsel is sometimes ignored.",
  "Knowledge": "How understanding shapes action."
};

MN.entries = [
  /* ───────────────────────── KRISHNA'S PEACE MISSION ───────────────────────── */
  {
    id: "krishna-peace-mission",
    title: "Krishna addresses the Kuru assembly",
    parva: "Udyoga Parva",
    section: "Bhagwat Yana Parva · Sections XCV, CXXVII, CXXVIII",
    episode: "Krishna's Peace Mission",
    passage: "Krishna speaks in the Kuru court seeking peace; Duryodhana refuses",
    characters: ["Krishna", "Dhritarashtra", "Duryodhana"],
    category: "Diplomacy",
    categories: ["Diplomacy", "Strategy", "Leadership"],
    themes: ["Negotiation", "Conflict management", "Consequences", "Listening"],
    situation: "War between the Pandavas and the Kauravas is drawing close. Krishna goes to the Kuru court at Hastinapura and, with the kings assembled and the hall silent, addresses Dhritarashtra so that the whole assembly can hear, urging that peace be established between the two sides.",
    decision: "Krishna chooses open, public negotiation as a final attempt before war, speaking to the king in front of the assembled court. Duryodhana, when his turn comes, rejects the proposal and refuses to give up any part of the Pandavas' share.",
    outcome: "The mission does not secure peace. Krishna replies sharply to Duryodhana and warns that a great slaughter will follow. Dhritarashtra then turns to Vidura about Gandhari (see the entry on Gandhari's counsel). The episode ends with the war still ahead.",
    excerpt: {
      text: "…even that much of our land which may be covered by the point of a sharp needle shall not, O Madhava, be given by us unto the Pandavas.",
      where: "Section CXXVII — Duryodhana's reply to Krishna (Ganguli)"
    },
    insight: "A sincere attempt at diplomacy can be the right action even when its success is uncertain: it tests whether a peaceful path still exists, puts positions on record, and shows that conflict was not entered lightly. The episode also shows that diplomacy depends on both sides being willing to listen.",
    modern_application: "Conflict resolution, labour or commercial negotiation, mediation between departments, and crisis planning, where leaders exhaust good-faith dialogue before choosing an irreversible course.",
    source: "Mahābhārata → Udyoga Parva → Bhagwat Yana Parva → Sections XCV, CXXVII–CXXVIII → Krishna's peace mission → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m05/m05095.htm",
    sourceLinks: [
      { label: "Section XCV — Krishna addresses the assembly", url: "https://www.sacred-texts.com/hin/m05/m05095.htm" },
      { label: "Section CXXVII — Duryodhana's reply", url: "https://www.sacred-texts.com/hin/m05/m05127.htm" },
      { label: "Section CXXVIII — Krishna's response", url: "https://www.sacred-texts.com/hin/m05/m05128.htm" }
    ],
    precision: "section",
    image: null,
    figures: ["krishna", "duryodhana", "dhritarashtra"], scene: "court", round: 1
  },
  {
    id: "elders-urge-peace",
    title: "Bhishma and Drona urge Duryodhana to accept peace",
    parva: "Udyoga Parva",
    section: "Bhagwat Yana Parva · Sections CXXV–CXXVI",
    episode: "Krishna's Peace Mission",
    passage: "The elders add their counsel after Krishna's speech",
    characters: ["Bhishma", "Drona", "Duryodhana", "Krishna"],
    category: "Governance",
    categories: ["Governance", "Leadership", "Diplomacy"],
    themes: ["Listening to counsel", "Anger", "Elders and advisers"],
    situation: "After Krishna has spoken, Bhishma addresses Duryodhana directly, telling him that Krishna has spoken wishing to bring peace between kinsmen and that he should follow that counsel instead of yielding to anger. In the next section Bhishma and Drona, sympathising with the old king, press Duryodhana again.",
    decision: "The senior counsellors use their standing to argue for peace, setting out what would be lost, and for what, if hostilities begin.",
    outcome: "Duryodhana is described as disobedient to this counsel and, in the next sections, declines to change his course.",
    excerpt: {
      text: "Krishna hath spoken to thee, desirous of bringing about peace between kinsmen. O sire, follow those counsels, and do not yield to the influence of wrath.",
      where: "Section CXXV — Bhishma to Duryodhana (Ganguli)"
    },
    insight: "Advice from experienced and respected people is only useful if the decision-maker is prepared to hear it. Anger and entrenched positions can make even strong, well-argued counsel ineffective.",
    modern_application: "Board and advisory structures, mentoring, and risk reviews: a leader needs a culture in which senior voices are heard and in which the leader can actually change course.",
    source: "Mahābhārata → Udyoga Parva → Bhagwat Yana Parva → Sections CXXV–CXXVI → Bhishma and Drona counsel Duryodhana → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m05/m05125.htm",
    sourceLinks: [
      { label: "Section CXXV — Bhishma's counsel", url: "https://www.sacred-texts.com/hin/m05/m05125.htm" },
      { label: "Section CXXVI — Bhishma and Drona", url: "https://www.sacred-texts.com/hin/m05/m05126.htm" }
    ],
    precision: "section",
    image: null,
    figures: ["bhishma", "duryodhana"], scene: "court", round: 1
  },
  {
    id: "gandhari-counsel",
    title: "Duryodhana disregards his mother's counsel",
    parva: "Udyoga Parva",
    section: "Bhagwat Yana Parva · Sections CXXIX–CXXX",
    episode: "Krishna's Peace Mission",
    passage: "Dhritarashtra sends for Gandhari; Duryodhana leaves in anger",
    characters: ["Dhritarashtra", "Vidura", "Gandhari", "Duryodhana"],
    category: "Human Behaviour",
    categories: ["Human Behaviour", "Diplomacy"],
    themes: ["Anger", "Family counsel", "Listening to counsel"],
    situation: "After Krishna's words, Dhritarashtra immediately asks Vidura to bring Gandhari so that she may try to persuade their son. Her counsel to Duryodhana is described as being of grave import.",
    decision: "The old king reaches for one more voice that Duryodhana might respect. Duryodhana, however, rejects what his mother says.",
    outcome: "Duryodhana leaves the court in anger and goes to the presence of people who encourage him in his resolve.",
    excerpt: {
      text: "Disregarding these words of grave import, spoken by his mother, Duryodhana went away, in anger, from that place to the presence of wicked persons.",
      where: "Section CXXX (Ganguli)"
    },
    insight: "A decision-maker who surrounds himself with agreeable voices after hearing a hard truth closes the last route to correction. The way we respond to unwelcome advice matters as much as the advice itself.",
    modern_application: "Avoiding echo chambers in teams and organisations: after hearing critical feedback, leaders should consult independent viewpoints instead of retreating to supporters.",
    source: "Mahābhārata → Udyoga Parva → Bhagwat Yana Parva → Sections CXXIX–CXXX → Gandhari's counsel → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m05/m05130.htm",
    sourceLinks: [
      { label: "Section CXXIX — Dhritarashtra sends Vidura", url: "https://www.sacred-texts.com/hin/m05/m05129.htm" },
      { label: "Section CXXX — Duryodhana's reaction", url: "https://www.sacred-texts.com/hin/m05/m05130.htm" }
    ],
    precision: "section",
    image: { file: "Duryodhana, Raja Ravi Varma (cropped).jpg", caption: "Duryodhana — Raja Ravi Varma, c. 1888–1890 (visual reference only)", credit: "Raja Ravi Varma (1848–1906)", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Duryodhana,_Raja_Ravi_Varma_(cropped).jpg" },
    figures: ["duryodhana", "dhritarashtra"], scene: "court", round: 1
  },

  /* ───────────────────────── ARJUNA'S DILEMMA ───────────────────────── */
  {
    id: "arjuna-dilemma",
    title: "Arjuna's despondency before the battle",
    parva: "Bhīṣma Parva",
    section: "Bhagavat-Gita Parva · Sections XXV–XXVI (Gita Ch. I–II)",
    episode: "Arjuna's Dilemma",
    passage: "Arjuna sees his kinsmen in both armies and loses heart",
    characters: ["Arjuna", "Krishna", "Sanjaya", "Dhritarashtra"],
    category: "Decision Making",
    categories: ["Decision Making", "Ethics", "Knowledge"],
    themes: ["Duty", "Emotion", "Uncertainty", "Seeking guidance"],
    situation: "The armies stand ready. Arjuna, with Krishna as his charioteer, looks across the field and sees relatives, teachers and friends on both sides. Overcome with pity and distress, he lays down his bow and sits down in the chariot, unable to proceed.",
    decision: "Rather than act in the grip of the first reaction, Arjuna turns to Krishna and asks to be instructed. Krishna begins by asking what has brought such dejection upon him at such a crisis, and the discourse that follows is the Bhagavad Gita.",
    outcome: "The conversation continues across the Gita. By its close Arjuna says that his doubt has been removed and that he will act (Gita 18.73); the narrative then proceeds towards the battle.",
    excerpt: {
      text: "Whence, O Arjuna, hath come upon thee, at such a crisis, this dejection…",
      where: "Section XXVI (Bhagavad Gita Ch. II) — Krishna begins his reply (Ganguli)"
    },
    insight: "When duty, emotion and consequence collide, the passage models pausing, naming the difficulty and seeking clarity before choosing — neither acting on impulse nor withdrawing from responsibility.",
    modern_application: "Ethical decision-making in healthcare, law and management; coaching and mentoring conversations; structured reflection before major career or organisational decisions.",
    source: "Mahābhārata → Bhīṣma Parva → Bhagavat-Gita Parva → Sections XXV–XXVI (Gita Ch. I–II) → Arjuna's dejection → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m06/m06025.htm",
    sourceLinks: [
      { label: "Section XXV — Gita Chapter I", url: "https://www.sacred-texts.com/hin/m06/m06025.htm" },
      { label: "Section XXVI — Gita Chapter II", url: "https://www.sacred-texts.com/hin/m06/m06026.htm" }
    ],
    precision: "section",
    image: { file: "Krishna and Arjun on the chariot, Mahabharata, 18th-19th century, India.jpg", caption: "Krishna and Arjuna on the chariot — carpet, India, 18th–19th century (visual reference only)", credit: "Anonymous", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Krishna_and_Arjun_on_the_chariot,_Mahabharata,_18th-19th_century,_India.jpg" },
    figures: ["krishna", "arjuna"], scene: "chariot", round: 2
  },
  {
    id: "gita-action",
    title: "Krishna on acting with clarity about duty",
    parva: "Bhīṣma Parva",
    section: "Bhagavat-Gita Parva · Section XXVI (Gita Ch. II)",
    episode: "Arjuna's Dilemma",
    passage: "Krishna's teaching on action and its results",
    characters: ["Krishna", "Arjuna"],
    category: "Knowledge",
    categories: ["Knowledge", "Ethics", "Decision Making"],
    themes: ["Duty", "Action and results", "Understanding"],
    situation: "In the second chapter of the Gita, Krishna answers Arjuna's distress with a sustained teaching. Among its themes is a distinction between acting and being fixated on the results of action, and a criticism of those who treat action mainly as a means to pleasure and power.",
    decision: "Krishna offers Arjuna a way of looking at action that separates the duty to act well from anxiety about outcomes.",
    outcome: "The teaching is the first step in a longer discourse (continuing through Ganguli's Sections XXVII onward) rather than a single resolution.",
    excerpt: null,
    insight: "Understanding comes before action: the text links clarity of knowledge to the quality of the decision that follows. The teaching can be read as encouraging focus on doing a task well rather than on controlling every result.",
    modern_application: "Performance and wellbeing practice, project work and study habits: concentrating on the quality of effort and process while staying realistic about outcomes that cannot be controlled.",
    source: "Mahābhārata → Bhīṣma Parva → Bhagavat-Gita Parva → Section XXVI (Gita Ch. II) → Krishna's teaching on action → K. M. Ganguli translation (chapter headings by J. B. Hare, sacred-texts.com)",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m06/m06026.htm",
    sourceLinks: [{ label: "Section XXVI — Gita Chapter II", url: "https://www.sacred-texts.com/hin/m06/m06026.htm" }],
    precision: "section",
    image: null,
    figures: ["krishna", "arjuna"], scene: "chariot", round: 2
  },

  /* ───────────────────────── THE DICE GAME ───────────────────────── */
  {
    id: "duryodhana-envy",
    title: "Envy at the Pandavas' prosperity",
    parva: "Sabhā Parva",
    section: "Dyuta Parva · Sections XLVI, LIII, LV",
    episode: "The Dice Game",
    passage: "Duryodhana's jealousy and the plan to win Yudhishthira's wealth",
    characters: ["Duryodhana", "Shakuni", "Dhritarashtra"],
    category: "Human Behaviour",
    categories: ["Human Behaviour", "Ethics"],
    themes: ["Envy", "Ambition", "Influence of advisers"],
    situation: "After seeing the splendour of the Pandavas' assembly hall and their prosperity, Duryodhana is consumed by jealousy. Shakuni suggests how Yudhishthira's wealth might be taken. Dhritarashtra tells his son not to be jealous of the Pandavas, noting that the jealous are always unhappy.",
    decision: "Duryodhana pursues the path proposed by Shakuni rather than the restraint his father advises; the invitation to a game of dice follows.",
    outcome: "Dhritarashtra's counsel is not decisive. The text goes on to describe the building of the assembly hall for the match (see the next entry).",
    excerpt: {
      text: "He that is jealous is always unhappy and suffereth the pangs of death.",
      where: "Section LIII — Dhritarashtra to Duryodhana (Ganguli)"
    },
    insight: "Comparison and envy distort judgment; they can turn a rival's success into a personal grievance and make harmful plans seem reasonable, especially when advisers feed them.",
    modern_application: "Workplace rivalry, ethical risks in competitive environments, and the importance of advisers who calm rather than amplify resentment.",
    source: "Mahābhārata → Sabhā Parva → Dyuta Parva → Sections XLVI, LIII, LV → Duryodhana's envy → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m02/m02053.htm",
    sourceLinks: [
      { label: "Section XLVI", url: "https://www.sacred-texts.com/hin/m02/m02046.htm" },
      { label: "Section LIII — Dhritarashtra's counsel", url: "https://www.sacred-texts.com/hin/m02/m02053.htm" },
      { label: "Section LV — Shakuni's proposal", url: "https://www.sacred-texts.com/hin/m02/m02055.htm" }
    ],
    precision: "section",
    image: null,
    figures: ["duryodhana", "shakuni"], scene: "dice", round: 3
  },
  {
    id: "dice-invitation",
    title: "The invitation to the dice match",
    parva: "Sabhā Parva",
    section: "Dyuta Parva · Sections LVI–LVIII",
    episode: "The Dice Game",
    passage: "Dhritarashtra orders the hall; Vidura objects but carries the invitation",
    characters: ["Dhritarashtra", "Vidura", "Yudhishthira"],
    category: "Decision Making",
    categories: ["Decision Making", "Governance", "Strategy"],
    themes: ["Social pressure", "Fate and choice", "Responsibility"],
    situation: "Dhritarashtra, aware of his son's inclinations and believing Fate cannot be avoided, orders an assembly hall to be prepared for a match at dice. Vidura says he does not approve and fears that the match will destroy the family through dissension. Vidura is nevertheless commanded to go, and he conveys the invitation to Yudhishthira, who goes to Hastinapura.",
    decision: "Dhritarashtra proceeds despite Vidura's warning, appealing to Fate. Yudhishthira accepts the invitation and enters the assembly hall.",
    outcome: "The game begins in the following sections.",
    excerpt: {
      text: "I approve not, O king, of this command of thine. Do not act so. I fear, this will bring about the destruction of our race.",
      where: "Section LVI — Vidura to Dhritarashtra (Ganguli)"
    },
    insight: "Appeals to fate, tradition or social obligation can become a way of avoiding responsibility for a foreseeable risk. The passage shows a decision taken while an informed adviser had already named the likely consequences.",
    modern_application: "Risk governance: ‘we always do it this way’ or ‘it is expected’ is not a substitute for assessing foreseeable harm; documenting and acting on dissenting expert views.",
    source: "Mahābhārata → Sabhā Parva → Dyuta Parva → Sections LVI–LVIII → The invitation to the dice match → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m02/m02056.htm",
    sourceLinks: [
      { label: "Section LVI — Dhritarashtra and Vidura", url: "https://www.sacred-texts.com/hin/m02/m02056.htm" },
      { label: "Section LVII — Vidura sent to Yudhishthira", url: "https://www.sacred-texts.com/hin/m02/m02057.htm" },
      { label: "Section LVIII — The Pandavas arrive", url: "https://www.sacred-texts.com/hin/m02/m02058.htm" }
    ],
    precision: "section",
    image: null,
    figures: ["dhritarashtra", "vidura", "yudhishthira"], scene: "dice", round: 3
  },
  {
    id: "dice-vidura-warning",
    title: "Vidura warns during the game",
    parva: "Sabhā Parva",
    section: "Dyuta Parva · Sections LXI–LXV",
    episode: "The Dice Game",
    passage: "Vidura's warning, Duryodhana's rebuke, and escalating stakes",
    characters: ["Vidura", "Dhritarashtra", "Duryodhana", "Shakuni", "Yudhishthira"],
    category: "Ethics",
    categories: ["Ethics", "Governance", "Leadership", "Decision Making"],
    themes: ["Consequences", "Speaking truth to power", "Escalation", "Unequal circumstances"],
    situation: "As the game proceeds towards Yudhishthira's ruin, Vidura speaks to Dhritarashtra, saying that gambling is the root of dissension and that its consequences are frightful. Duryodhana rebukes Vidura. Shakuni then urges Yudhishthira to stake whatever he has not yet lost, and Duryodhana soon tells Vidura to bring Draupadi.",
    decision: "Vidura publicly names the long-term consequences, accepting the risk of being rebuked. The stakes keep rising rather than stopping.",
    outcome: "Vidura's warning is not heeded; the escalation continues and leads to the assembly debate that follows (see the next entry).",
    excerpt: {
      text: "Gambling is the root of dissensions. It bringeth about disunion. Its consequences are frightful.",
      where: "Section LXII — Vidura (Ganguli)"
    },
    insight: "The episode places short-term pressure and winning momentum against long-term ethical responsibility. It shows the value, and the cost, of the adviser who speaks about consequences when no one wants to hear them.",
    modern_application: "Whistle-blowing and safety culture; resisting escalation of commitment in projects, investments and negotiations; protecting participants where power and information are unequal.",
    source: "Mahābhārata → Sabhā Parva → Dyuta Parva → Sections LXI–LXV → Vidura's warning → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m02/m02062.htm",
    sourceLinks: [
      { label: "Section LXI — Vidura intervenes", url: "https://www.sacred-texts.com/hin/m02/m02061.htm" },
      { label: "Section LXII — Vidura's warning", url: "https://www.sacred-texts.com/hin/m02/m02062.htm" },
      { label: "Section LXIII — Duryodhana's rebuke", url: "https://www.sacred-texts.com/hin/m02/m02063.htm" },
      { label: "Section LXIV — Shakuni presses on", url: "https://www.sacred-texts.com/hin/m02/m02064.htm" },
      { label: "Section LXV — Draupadi to be brought", url: "https://www.sacred-texts.com/hin/m02/m02065.htm" }
    ],
    precision: "section",
    image: { file: "Draupadi Vastraharan, Raja Ravi Varma.jpg", caption: "Draupadi Vastraharan — Raja Ravi Varma, c. 1888–1890. Depicts a later moment in the same assembly (visual reference only)", credit: "Raja Ravi Varma (1848–1906)", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Draupadi_Vastraharan,_Raja_Ravi_Varma.jpg" },
    figures: ["vidura", "yudhishthira", "shakuni", "duryodhana"], scene: "dice", round: 3
  },
  {
    id: "dice-assembly-question",
    title: "The assembly debates the stake",
    parva: "Sabhā Parva",
    section: "Dyuta Parva · Sections LXVIII–LXX",
    episode: "The Dice Game",
    passage: "Draupadi and the assembly: who may stake what?",
    characters: ["Draupadi", "Duryodhana", "Karna", "Bhishma", "Vidura"],
    category: "Ethics",
    categories: ["Ethics", "Governance"],
    themes: ["Fairness", "Legitimacy", "Silence of bystanders"],
    situation: "Draupadi addresses the assembly, saying she has a high duty to perform and raising a question about the stakes. The kings present are described as silent out of fear of Duryodhana. The debate in the following section turns on the order of the stakes: whether a person who has already lost himself may still stake anything, and whether the loser can be regarded as the master of what was staked.",
    decision: "Some members of the assembly argue the matter on the grounds of rules and legitimacy; most remain silent.",
    outcome: "The assembly's answer is contested and incomplete in these sections. The passage is important because it records a challenge to the fairness of the whole proceeding.",
    excerpt: null,
    insight: "Rules and consent matter, and a decision can be tested for legitimacy by those it affects. The silence of the powerful is itself a choice with consequences.",
    modern_application: "Institutional governance: due process, conflicts of interest and informed consent, and the responsibility of bystanders in meetings and organisations to speak when procedures are unfair.",
    source: "Mahābhārata → Sabhā Parva → Dyuta Parva → Sections LXVIII–LXX → The assembly and Draupadi's question → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m02/m02067.htm",
    sourceLinks: [
      { label: "Section LXVIII — Draupadi speaks", url: "https://www.sacred-texts.com/hin/m02/m02067.htm" },
      { label: "Section LXIX — The assembly", url: "https://www.sacred-texts.com/hin/m02/m02068.htm" },
      { label: "Section LXX — The debate", url: "https://www.sacred-texts.com/hin/m02/m02069.htm" }
    ],
    precision: "section",
    image: { file: "Draupadi Vastraharan, Raja Ravi Varma.jpg", caption: "Draupadi Vastraharan — Raja Ravi Varma, c. 1888–1890 (visual reference only)", credit: "Raja Ravi Varma (1848–1906)", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Draupadi_Vastraharan,_Raja_Ravi_Varma.jpg" },
    figures: ["draupadi", "duryodhana", "vidura"], scene: "dice", round: 3
  },

  /* ───────────────────────── VIDURA'S COUNSEL ───────────────────────── */
  {
    id: "vidura-consider-before-acting",
    title: "Consider the act, the agent and the purpose",
    parva: "Udyoga Parva",
    section: "Prajagara section · Sections XXXIII–XXXIV",
    episode: "Vidura's Counsel",
    passage: "A sleepless Dhritarashtra asks Vidura for advice",
    characters: ["Dhritarashtra", "Vidura"],
    category: "Strategy",
    categories: ["Strategy", "Decision Making", "Governance"],
    themes: ["Planning", "Proportion", "Honest advice", "Consequences"],
    situation: "Sanjaya has returned from the Pandavas and will deliver their message the next day. Dhritarashtra, burning with anxiety and unable to sleep, sends for Vidura and asks what is good for a person in his condition and for the Kurus. Vidura replies that one should speak truly to a person whose defeat one does not wish, even when unasked, and then sets out principles for acting.",
    decision: "Vidura advises not to set the heart on unjust means, and to consider before any act the competence of the agent, the nature of the act and its purpose, rather than beginning on a sudden impulse.",
    outcome: "Vidura's counsel continues for several sections (XXXV onward). The text presents it as advice; the narrative itself shows how far Dhritarashtra acts on it.",
    excerpt: {
      text: "Before one engageth in an act, one should consider the competence of the agent, the nature of the act itself, and its purpose, for all acts are dependent on these.",
      where: "Section XXXIV — Vidura (Ganguli)"
    },
    insight: "Good strategy begins with an honest assessment of capability, the task itself and its purpose, along with its consequences if it succeeds, before commitment, not after.",
    modern_application: "Project feasibility reviews, strategic planning, go/no-go decisions, and the practice of asking advisers for candid, not flattering, assessments.",
    source: "Mahābhārata → Udyoga Parva → Prajagara section (Vidura's counsel) → Sections XXXIII–XXXIV → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m05/m05034.htm",
    sourceLinks: [
      { label: "Section XXXIII — Dhritarashtra summons Vidura", url: "https://www.sacred-texts.com/hin/m05/m05033.htm" },
      { label: "Section XXXIV — Vidura's counsel begins", url: "https://www.sacred-texts.com/hin/m05/m05034.htm" }
    ],
    precision: "section",
    image: { file: "Vidura confers with Dhritarashtra.jpg", caption: "Vidura confers with Dhritarashtra — attributed to Purkhu, c. 1820 (visual reference only)", credit: "Purkhu", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Vidura_confers_with_Dhritarashtra.jpg" },
    figures: ["vidura", "dhritarashtra"], scene: "court", round: null
  },
  {
    id: "vidura-kindness-and-limits",
    title: "Kindness to all, and the marks of foolishness",
    parva: "Udyoga Parva",
    section: "Prajagara section · Sections XXXV, XXXVII",
    episode: "Vidura's Counsel",
    passage: "Vidura on fairness towards one's sons and on the kinds of foolish conduct",
    characters: ["Vidura", "Dhritarashtra"],
    category: "Governance",
    categories: ["Governance", "Human Behaviour", "Leadership"],
    themes: ["Fairness", "Self-awareness", "Overreach"],
    situation: "Dhritarashtra asks Vidura to continue. Vidura says kindness to all creatures equals, or surpasses, pilgrimage, and urges the king to show kindness to all his sons. Later he lists seventeen kinds of foolish people, among them one who tries to control what cannot be controlled, who is content with small gains, who pays court to enemies, or who boasts after doing something.",
    decision: "Vidura frames fairness inside the royal household and realistic self-assessment as practical requirements of rule.",
    outcome: "The discourse continues; the list is presented as general counsel, not tied to a single event.",
    excerpt: null,
    insight: "Fair treatment of everyone under one's care and a realistic sense of one's limits are presented as part of sound judgment, the counterpart of the envy and overreach shown elsewhere in the epic.",
    modern_application: "Inclusive leadership and avoiding favouritism; recognising overreach, vanity metrics and wishful goals in strategy and management.",
    source: "Mahābhārata → Udyoga Parva → Prajagara section (Vidura's counsel) → Sections XXXV, XXXVII → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m05/m05035.htm",
    sourceLinks: [
      { label: "Section XXXV — kindness and fairness", url: "https://www.sacred-texts.com/hin/m05/m05035.htm" },
      { label: "Section XXXVII — the seventeen kinds of foolish men", url: "https://www.sacred-texts.com/hin/m05/m05037.htm" }
    ],
    precision: "section",
    image: { file: "Vidura confers with Dhritarashtra.jpg", caption: "Vidura confers with Dhritarashtra — attributed to Purkhu, c. 1820 (visual reference only)", credit: "Purkhu", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Vidura_confers_with_Dhritarashtra.jpg" },
    figures: ["vidura", "dhritarashtra"], scene: "court", round: null
  },

  /* ───────────────────────── BHISHMA ───────────────────────── */
  {
    id: "bhishma-vow",
    title: "Devavrata's vow",
    parva: "Ādi Parva",
    section: "Sambhava Parva · Section C",
    episode: "Bhishma's Vow",
    passage: "Devavrata renounces his claim so his father can marry Satyavati",
    characters: ["Devavrata (Bhishma)", "Shantanu", "Satyavati's father"],
    category: "Leadership",
    categories: ["Leadership", "Ethics", "Decision Making"],
    themes: ["Sacrifice", "Commitment", "Long-term consequences"],
    situation: "King Shantanu wishes to marry Satyavati, but her father demands that her son must be king. Devavrata, Shantanu's son and heir, learns of his father's distress and goes to Satyavati's father to settle the matter.",
    decision: "In the hearing of the assembled chiefs, Devavrata takes a vow that the son of this maiden will be king. As the tradition recounts, he also adopts a vow of lifelong celibacy so that no rival claim can arise.",
    outcome: "The marriage takes place and Devavrata becomes known as Bhishma, ‘the terrible’, on account of his vow. The effects of the vow run through the later succession disputes.",
    excerpt: {
      text: "The son that may be born of this maiden shall be our king.",
      where: "Section C — Devavrata's declaration (Ganguli)"
    },
    insight: "A leader's commitments can solve one problem while creating lasting structural consequences. The episode shows the weight of binding promises and how they may shape a whole institution for generations.",
    modern_application: "Succession planning, binding contracts and constitutional commitments: considering how a decision made for one moment will constrain later generations of an organisation.",
    source: "Mahābhārata → Ādi Parva → Sambhava Parva → Section C → Devavrata's vow → K. M. Ganguli translation",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m01/m01101.htm",
    sourceLinks: [{ label: "Section C — Sambhava Parva (continued)", url: "https://www.sacred-texts.com/hin/m01/m01101.htm" }],
    precision: "section",
    image: { file: "Bheeshma oath by RRV.jpg", caption: "Bheeshma's oath — Raja Ravi Varma (visual reference only)", credit: "Raja Ravi Varma", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Bheeshma_oath_by_RRV.jpg" },
    figures: ["bhishma"], scene: "gallery", round: null
  },
  {
    id: "bhishma-teachings",
    title: "Bhishma instructs Yudhishthira on rulership",
    parva: "Śānti Parva",
    section: "Rājadharmānuśāsana sub-parva (see the translation's index for section numbers)",
    episode: "Bhishma's Teachings",
    passage: "After the war, Bhishma on the bed of arrows teaches the new king",
    characters: ["Bhishma", "Yudhishthira"],
    category: "Governance",
    categories: ["Governance", "Leadership", "Knowledge"],
    themes: ["Rājadharma", "Mentoring", "Responsibility of rulers"],
    situation: "The war is over and Yudhishthira is to rule. Bhishma, lying wounded on the bed of arrows, is approached by Yudhishthira, and the Śānti Parva records his long instruction on the duties of rulers and on dharma and good government.",
    decision: "The new king chooses to learn from an experienced elder before ruling rather than relying only on his own judgment.",
    outcome: "The Śānti Parva is among the longest books of the epic; its teachings are collected under the sub-parvas of royal duty, conduct in times of distress, and liberation.",
    excerpt: null,
    insight: "Authority is framed as something to be learned and exercised responsibly, with an elder's experience passed to the next ruler.",
    modern_application: "Leadership transitions, mentoring and executive onboarding: capturing the knowledge of experienced leaders and giving new leaders time to learn before they act.",
    source: "Mahābhārata → Śānti Parva → Rājadharmānuśāsana sub-parva → Bhishma's instruction to Yudhishthira → K. M. Ganguli translation (section numbers to be confirmed against the translation's index)",
    translator: "Kisari Mohan Ganguli", language: "English",
    sourceUrl: "https://www.sacred-texts.com/hin/m12/index.htm",
    sourceLinks: [{ label: "Śānti Parva — translation index", url: "https://www.sacred-texts.com/hin/m12/index.htm" }],
    precision: "parva",
    image: { file: "Bhisma is lying on a bed of arrows with Arjuna standing above him with bow drawn and pointed..jpg", caption: "Bhishma on the bed of arrows, c. 1895, unknown artist (visual reference only)", credit: "Unknown artist", license: "Public domain", page: "https://commons.wikimedia.org/wiki/File:Bhisma_is_lying_on_a_bed_of_arrows_with_Arjuna_standing_above_him_with_bow_drawn_and_pointed..jpg" },
    figures: ["bhishma", "yudhishthira"], scene: "gallery", round: null
  }
];

/* Featured episodes on the Home page (each links to an entry). */
MN.featured = [
  { episode: "Krishna's Peace Mission", entry: "krishna-peace-mission", blurb: "Public diplomacy in the Kuru court before the war." },
  { episode: "Arjuna's Dilemma",        entry: "arjuna-dilemma",        blurb: "Duty, emotion and the search for clarity on the battlefield." },
  { episode: "The Dice Game",           entry: "dice-vidura-warning",   blurb: "Pressure, escalating stakes and a warning that went unheeded." },
  { episode: "Vidura's Counsel",        entry: "vidura-consider-before-acting", blurb: "Candid advice on weighing the act, the agent and the purpose." },
  { episode: "Bhishma's Teachings",     entry: "bhishma-teachings",     blurb: "An elder teaches the new king the duties of rule." }
];

/* Characters with 3D sculptures (Sculpture Gallery). `fig` keys map to MN3D figure recipes. */
MN.characters = {
  krishna:      { name: "Krishna",        role: "Charioteer and counsellor of Arjuna; envoy of the Pandavas to the Kuru court.", icon: "krishna" },
  arjuna:       { name: "Arjuna",         role: "A Pandava prince and archer; the hearer of the Bhagavad Gita." },
  bhishma:      { name: "Bhishma",        role: "Elder of the Kuru house, known for his vow; teacher of Yudhishthira after the war." },
  vidura:       { name: "Vidura",         role: "Counsellor to Dhritarashtra, remembered for candid advice on conduct and rule." },
  yudhishthira: { name: "Yudhishthira",   role: "Eldest of the Pandavas; invited to the dice match and later instructed by Bhishma." },
  duryodhana:   { name: "Duryodhana",     role: "Eldest of the Kauravas; rejects Krishna's proposal for peace." },
  dhritarashtra:{ name: "Dhritarashtra",  role: "Blind king of the Kurus; hears counsel from Vidura, Bhishma and Sanjaya." },
  shakuni:      { name: "Shakuni",        role: "King of Gandhara and Duryodhana's maternal uncle; proposes the dice match." },
  draupadi:     { name: "Draupadi",       role: "Wife of the Pandavas; speaks in the assembly after the game." }
};

/* ──────────────────────── DHARMA DECISION (game) ────────────────────────
   score: 2 = more closely aligned with the lesson highlighted in the episode
          1 = partly aligned, raises an additional consideration
          0 = raises a different ethical consideration
   Wording intentionally never claims a choice is objectively right or wrong. */
MN.game = {
  scoreName: "Reflection Score",
  labels: {
    2: "More closely aligned with the lesson highlighted in this episode.",
    1: "Partly aligned with the lesson in this episode — this choice adds an extra consideration.",
    0: "This choice raises a different ethical consideration."
  },
  rounds: [
    {
      id: 1, title: "Krishna's Peace Mission", scene: "court", entry: "krishna-peace-mission",
      situation: "Conflict between the Pandavas and Kauravas is approaching. Before war begins, there is still an opportunity for diplomacy. What should a responsible leader consider first?",
      area: "Diplomacy & conflict management",
      choices: [
        { key: "A", text: "Attempt sincere negotiation and understand whether peace is still possible.", score: 2,
          result: "You open a channel for dialogue before any irreversible step is taken.",
          explanation: "In the Udyoga Parva, Krishna goes to the Kuru court and speaks publicly in favour of peace (Section XCV). Bhishma and Drona add their voices (Sections CXXV–CXXVI). The attempt does not succeed, but it tests whether peace is still possible and puts every position on record.",
          parallel: "Krishna's address to Dhritarashtra and the assembled kings.",
          insight: "A sincere attempt at diplomacy can be worth making even when success is uncertain.",
          application: "Mediation, negotiation and crisis planning: exhaust good-faith dialogue before escalating." },
        { key: "B", text: "Immediately prepare for war without negotiation.", score: 1,
          result: "You protect your side's readiness, but the chance of dialogue is not explored.",
          explanation: "The Udyoga Parva is the ‘Book of Effort’ and both sides gather strength; readiness is not ignored in the epic. The lesson highlighted in the peace-mission passages, however, is that preparation and negotiation are not alternatives: Krishna still goes to the court.",
          parallel: "Preparations for war in the Udyoga Parva alongside Krishna's mission.",
          insight: "Preparedness and diplomacy can coexist; preparing alone leaves the peaceful route untested.",
          application: "Business continuity planning alongside negotiation, not instead of it." },
        { key: "C", text: "Ignore the conflict and hope it disappears.", score: 0,
          result: "Time passes and the conflict continues to grow.",
          explanation: "In the epic, Dhritarashtra's sleepless anxiety and appeals to Fate (Sections XXXIII, LVI) show how avoiding a hard decision does not remove it. Vidura's counsel is to consider the act and its consequences rather than wait.",
          parallel: "Dhritarashtra's anxiety before Sanjaya's message; Vidura's advice.",
          insight: "Inaction is also a decision, and it carries consequences.",
          application: "Issue management: unresolved problems usually escalate without leadership attention." },
        { key: "D", text: "Make a decision without hearing the other side.", score: 0,
          result: "A decision is taken without the information the other party could have given.",
          explanation: "Counsellors in the Kuru court repeatedly urge Duryodhana to listen (Sections CXXV–CXXVI), and Gandhari's counsel is disregarded (Section CXXX). Their appeals are about hearing others before closing a decision.",
          parallel: "Counsel offered to Duryodhana by Bhishma, Drona and Gandhari.",
          insight: "Decisions made without hearing other perspectives are more likely to miss risks.",
          application: "Stakeholder consultation and due process in organisations." }
      ]
    },
    {
      id: 2, title: "Arjuna's Dilemma", scene: "chariot", entry: "arjuna-dilemma",
      situation: "Arjuna faces a difficult decision involving duty, personal emotion and the consequences of action.",
      area: "Decision-making under uncertainty",
      choices: [
        { key: "A", text: "Act impulsively.", score: 0,
          result: "The decision is taken in the heat of the moment.",
          explanation: "In Gita Chapter I (Section XXV), Arjuna's first reaction to the sight of his kinsmen is distress: he lays aside his bow and sits down in the chariot. Krishna's reply (Section XXVI) begins by asking where such dejection has come from at such a crisis. The passage does not treat the first impulse as the end of the matter.",
          parallel: "Arjuna's first reaction before Krishna's instruction.",
          insight: "A first emotional reaction is information, but not necessarily a good basis for a decision.",
          application: "Pause-and-reflect practice in high-stakes professional decisions." },
        { key: "B", text: "Seek clarity, examine duty and understand the consequences before acting.", score: 2,
          result: "You pause, ask questions and look at the situation from more than one side.",
          explanation: "Arjuna turns to Krishna and asks for guidance; the Bhagavad Gita is the discourse that follows. By its end Arjuna says his doubts are removed and that he will act (Gita 18.73). The episode is often read as a model of reflective decision-making under uncertainty.",
          parallel: "Arjuna's dialogue with Krishna across the Gita.",
          insight: "Clarity about duty, consequence and one's own state of mind precedes sound action.",
          application: "Ethical decision frameworks, coaching conversations and structured reflection." },
        { key: "C", text: "Avoid every difficult responsibility.", score: 0,
          result: "The difficulty is set aside, but it remains.",
          explanation: "Arjuna's initial impulse in Chapter I is in a sense to withdraw. Krishna's teaching in Chapter II is a response to that stance and encourages engagement with duty with understanding, instead of avoidance.",
          parallel: "Arjuna laying down his bow, and Krishna's reply in Chapter II.",
          insight: "Avoidance does not resolve a dilemma; it leaves it unaddressed.",
          application: "Accountability and ownership in teams and public roles." },
        { key: "D", text: "Let someone else decide without understanding the issue.", score: 1,
          result: "A decision is made, but you do not understand the reasoning behind it.",
          explanation: "Arjuna does ask Krishna to instruct him — so seeking an adviser is part of the story. What the Gita emphasises, though, is that Arjuna is led to understand the reasoning and then states his own resolve. Delegation without understanding would miss that part.",
          parallel: "Arjuna asking for instruction, and later affirming his own resolve (Gita 18.73).",
          insight: "Seeking advice is wise; handing over responsibility without understanding is a different matter.",
          application: "Informed consent and reasoned delegation of decisions." }
      ]
    },
    {
      id: 3, title: "The Dice Game", scene: "dice", entry: "dice-vidura-warning",
      situation: "A decision is being made under social pressure and unequal circumstances. What should a responsible leader consider?",
      area: "Ethical responsibility & long-term thinking",
      choices: [
        { key: "A", text: "Only immediate social pressure.", score: 1,
          result: "The room's expectations steer the decision.",
          explanation: "The Sabhā Parva shows how strong social pressure can be: the kings in the assembly are described as silent out of fear of Duryodhana (Section LXIX). Pressure is real, but the passage shows what happens when it alone is allowed to decide.",
          parallel: "The silence of the kings in the assembly.",
          insight: "Social pressure is a genuine factor, but it should not be the only one.",
          application: "Group decision-making and peer pressure in organisations." },
        { key: "B", text: "Long-term consequences and ethical responsibility.", score: 2,
          result: "You weigh what the decision will mean beyond this moment and for those affected.",
          explanation: "Vidura warns that gambling is the root of dissensions and that its consequences are frightful (Section LXII), and he had already said he feared the destruction of the family (Section LVI). He is rebuked (Section LXIII) but names the long-term consequences.",
          parallel: "Vidura's warnings to Dhritarashtra and Duryodhana.",
          insight: "Long-term consequences and responsibility to those affected deserve a voice, especially when circumstances are unequal.",
          application: "Whistle-blowing, safety culture and ethical risk management." },
        { key: "C", text: "Whether everyone else is doing the same thing.", score: 0,
          result: "The decision follows the crowd.",
          explanation: "In the assembly, Draupadi's question and the debate that follows (Sections LXVIII–LXX) challenge the legitimacy of what is happening. The passage invites us to ask whether a practice is fair, not just whether it is widespread.",
          parallel: "The assembly's debate about the legitimacy of the stake.",
          insight: "A widely shared practice is not automatically a fair one.",
          application: "Compliance and culture reviews: ‘everyone does it’ is not an ethical analysis." },
        { key: "D", text: "Personal gain alone.", score: 0,
          result: "The decision is guided only by what you can win.",
          explanation: "Section LV records Shakuni's plan to take Yudhishthira's wealth, and Section LIII records Dhritarashtra telling Duryodhana that jealousy brings unhappiness. The episode illustrates how a gain-only view leaves out the interests of others.",
          parallel: "Shakuni's proposal and Dhritarashtra's counsel on envy.",
          insight: "Considering only personal gain ignores others and often the decision-maker's own long-term interest.",
          application: "Conflict-of-interest management and stakeholder-based decision making." }
      ]
    }
  ],
  lessons: [
    "Diplomacy is worth attempting even when success is uncertain (Udyoga Parva).",
    "Pause and seek clarity about duty and consequence before acting (Bhagavad Gita).",
    "Pressure and unequal circumstances call for attention to long-term, ethical consequences (Sabhā Parva)."
  ]
};

/* Optional realistic 3D models. Drop .glb files in /models and map them here,
   e.g. krishna: "models/krishna.glb". Empty = built-in procedural sculptures. */
MN.models = {};

/* One-line derived insights (MahaNiti interpretations — NOT quotations from the text). */
MN.maxims = {
  "krishna-peace-mission": "Exhaust sincere dialogue before committing to an irreversible course.",
  "elders-urge-peace": "Counsel is only as useful as the leader's willingness to hear it.",
  "gandhari-counsel": "After hard advice, widen your circle of counsel rather than narrowing it.",
  "arjuna-dilemma": "When duty and emotion collide, pause and seek clarity before acting.",
  "gita-action": "Understand the task and your duty first; focus on the quality of action rather than on controlling every result.",
  "duryodhana-envy": "Envy distorts judgment and makes harmful plans seem reasonable.",
  "dice-invitation": "Appeals to fate or custom do not remove responsibility for a foreseeable risk.",
  "dice-vidura-warning": "Speak about long-term consequences even when the room does not want to hear them.",
  "dice-assembly-question": "A decision can be tested for fairness by those it affects; silence is also a choice.",
  "vidura-consider-before-acting": "Consider the agent, the act and its purpose before beginning, never on a sudden impulse.",
  "vidura-kindness-and-limits": "Treat everyone under your care fairly, and know the limits of your power.",
  "bhishma-vow": "A binding commitment can solve today's problem and shape an institution for generations.",
  "bhishma-teachings": "Authority is a responsibility to be learned from experience."
};
MN.entries.forEach(function (e) { e.maxim = MN.maxims[e.id]; });
