"use client";

import { JSX, useState } from "react";
import { ChevronDown } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string | JSX.Element; 
}
 
const faqData: FAQItem[] = [
  {
    question: "What is Africa Research Base?",
    answer:
      "Africa Research Base is an open data economy for African research — a decentralized data repository where datasets and research outputs can be uploaded for tokenized incentives. It's built to make African research more visible, accessible, and community-driven.",
  },
  {
    question: "How does it work?",
    answer: (
      <div>
        <p className="mb-3">
          AFB combines blockchain technology, tokenized incentives, and
          community governance.
        </p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>
            Researchers upload and access data through a decentralized
            repository.
          </li>
          <li>Contributors earn AFB Points for participation.</li>
          <li>
            Funding decisions are made collectively through a DAO (Decentralized
            Autonomous Organization).
          </li>
        </ul>
      </div>
    ),
  },
  {
    question: "What is the DAO, and who can join it?",
    answer:
      "The AFB DAO governs the community's decisions, from funding allocations to validation of data. Anyone who contributes to the platform can become a member and participate in voting.",
  },
  {
    question: "What kind of data can be uploaded?",
    answer:
      "Any African-generated data that advances research and innovation — health, environmental, social, or economic data.",
  },
  {
    question: "How can I earn AFB Points or Tokens?",
    answer: (
      <div>
        <p className="mb-3">You earn AFB Points by:</p>
        <ul className="list-disc list-inside space-y-2 ml-2">
          <li>Uploading or verifying datasets</li>
          <li>Contributing to discussions</li>
          <li>Promoting your uploads on social media</li>
        </ul>
        <p className="mt-3">
          These points can be redeemed for USDC equivalents or converted into
          AFB tokens, which can then be used to access datasets or fund research
          projects.
        </p>
      </div>
    ),
  },
  {
    question: "Do I need a crypto wallet to use Africa Research Base?",
    answer:
      "You do not need a wallet to sign up, but you will need a wallet to receive your rewards and vote on community decisions.",
  },
  {
    question: "Do I have to be a researcher to join?",
    answer:
      "No. Africa Research Base is for anyone interested in African data and innovation. If you care about African research, you can participate — by contributing data, validating research, spreading awareness, or funding small projects.",
  },
];

interface FAQAccordionProps {
  item: FAQItem;
  isOpen: boolean;
  onClick: () => void;
}

const FAQAccordion = ({ item, isOpen, onClick }: FAQAccordionProps) => {
  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden transition-all duration-200 hover:border-blue-300">
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition-colors duration-200"
        aria-expanded={isOpen}
      >
        <span className="text-lg font-semibold text-gray-900 pr-4">
          {item.question}
        </span>
        <ChevronDown
          className={`w-5 h-5 text-blue-600 flex-shrink-0 transition-transform duration-200 ${
            isOpen ? "transform rotate-180" : ""
          }`}
        />
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? "max-h-96" : "max-h-0"
        }`}
      >
        <div className="p-6 pt-0 text-gray-700 leading-relaxed">
          {typeof item.answer === "string" ? item.answer : item.answer}
        </div>
      </div>
    </div>
  );
};

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        Frequently Asked Questions
      </h1>
      <div className="space-y-4">
        {faqData.map((item, index) => (
          <FAQAccordion
            key={index}
            item={item}
            isOpen={openIndex === index}
            onClick={() => handleToggle(index)}
          />
        ))}
      </div>
    </main>
  );
}
