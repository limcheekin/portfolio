---
title: "WareBot: Warehouse Assistant"
description: "Delivered a conversational AI assistant for a Warehouse Management System with natural-language stock queries, warehouse operations, SSE streaming and explicit confirmation before writes. Integrated locally hosted Qwen3.5 inference."
featured: true
featuredOrder: 3
kind: enterprise
org: "Daxonet AI"
tagline: "Ask the warehouse in plain language. Every write waits for an explicit confirmation."
stack: ["Local Qwen", "SSE", "Maestro"]
visual: ware
technologies: ["Enterprise AI", "Qwen3.5", "SSE", "Maestro", "Newman"]
category: "Enterprise AI"
---

WareBot is a conversational AI assistant for a Warehouse Management System, built at Daxonet AI. Users ask about stock and run warehouse operations in natural language, with responses streamed over SSE.

Every write operation waits for an explicit confirmation. Inference runs on a locally hosted Qwen3.5 model. Quality is covered by three Maestro UI test flows and a 21-assertion Newman API suite.
