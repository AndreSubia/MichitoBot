import { useState, useEffect } from "react";
import { Rule } from "../types";

export function useRules() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isCreatingRule, setIsCreatingRule] = useState(false);
  const [ruleInput, setRuleInput] = useState("");

  const fetchRules = async () => {
    try {
      const res = await fetch("/api/rules");
      const data = await res.json();
      if (Array.isArray(data)) setRules(data);
    } catch (err) {
      console.error("Error fetching rules:", err);
    }
  };

  const handleCreateRule = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!ruleInput.trim() || isCreatingRule) return;

    setIsCreatingRule(true);
    try {
      const res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: ruleInput })
      });
      
      if (res.ok) {
        const newRule = await res.json();
        setRules(prev => [...prev, newRule]);
        setRuleInput("");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingRule(false);
    }
  };

  useEffect(() => {
    fetchRules();
  }, []);

  return {
    rules,
    ruleInput,
    setRuleInput,
    isCreatingRule,
    handleCreateRule,
    fetchRules
  };
}
