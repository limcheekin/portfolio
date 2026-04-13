import { useEffect } from 'react';

interface PortfolioData {
  projects: Array<{ title: string; description: string; technologies: string[]; slug: string }>;
  experience: Array<{ title: string; company: string; startDate: string; endDate?: string }>;
}

interface WebMCPToolsProps {
  portfolioApiUrl: string;
  contactEmail: string;
  engineerName: string;
}

export default function WebMCPTools({ portfolioApiUrl, contactEmail, engineerName }: WebMCPToolsProps) {
  useEffect(() => {
    const nav = navigator as any;
    if (!nav.modelContext) return;

    let registered = false;

    async function register() {
      try {
        const mc = nav.modelContext;

        mc.registerTool({
          name: 'get_projects',
          description: `Get all projects by ${engineerName}. Returns project titles, descriptions, technologies, and URLs.`,
          inputSchema: { type: 'object', properties: {} },
          async execute() {
            const res = await fetch(portfolioApiUrl);
            const data: PortfolioData = await res.json();
            return { content: [{ type: 'text', text: JSON.stringify(data.projects, null, 2) }] };
          },
        });

        mc.registerTool({
          name: 'get_experience',
          description: `Get work experience history for ${engineerName}. Returns job titles, companies, and date ranges.`,
          inputSchema: { type: 'object', properties: {} },
          async execute() {
            const res = await fetch(portfolioApiUrl);
            const data: PortfolioData = await res.json();
            return { content: [{ type: 'text', text: JSON.stringify(data.experience, null, 2) }] };
          },
        });

        mc.registerTool({
          name: 'get_contact_info',
          description: `Get contact information for ${engineerName}.`,
          inputSchema: { type: 'object', properties: {} },
          async execute() {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  name: engineerName,
                  email: contactEmail,
                  github: 'https://github.com/limcheekin',
                  linkedin: 'https://linkedin.com/in/limcheekin',
                  medium: 'https://medium.com/@limcheekin',
                }, null, 2)
              }]
            };
          },
        });

        mc.registerTool({
          name: 'search_portfolio',
          description: `Search across all portfolio content (projects, articles, experience) for ${engineerName}. Returns matching items.`,
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query to match against portfolio content' }
            },
            required: ['query']
          },
          async execute(input: { query: string }) {
            const res = await fetch(portfolioApiUrl);
            const data = await res.json();
            const q = input.query.toLowerCase();
            const results = {
              projects: data.projects.filter((p: any) =>
                p.title.toLowerCase().includes(q) || p.description.toLowerCase().includes(q) || p.technologies.some((t: string) => t.toLowerCase().includes(q))
              ),
              articles: data.articles.filter((a: any) =>
                a.title.toLowerCase().includes(q) || a.description.toLowerCase().includes(q)
              ),
              experience: data.experience.filter((e: any) =>
                e.title.toLowerCase().includes(q) || e.company.toLowerCase().includes(q)
              ),
            };
            return { content: [{ type: 'text', text: JSON.stringify(results, null, 2) }] };
          },
        });

        registered = true;
      } catch (e) {
        // WebMCP not supported in this browser — silently skip
      }
    }

    register();

    return () => {
      if (registered && nav.modelContext) {
        try {
          nav.modelContext.unregisterTool('get_projects');
          nav.modelContext.unregisterTool('get_experience');
          nav.modelContext.unregisterTool('get_contact_info');
          nav.modelContext.unregisterTool('search_portfolio');
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, [portfolioApiUrl, contactEmail, engineerName]);

  return null;
}
