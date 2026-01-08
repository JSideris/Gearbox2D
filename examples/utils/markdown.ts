/**
 * A simple markdown parser that converts markdown strings to HTML.
 * Supports headings, bold, italic, links, lists, and paragraphs.
 */
export default class MarkdownParser {
    /**
     * Parses a markdown string and returns the corresponding HTML.
     * @param markdown The markdown string to parse.
     * @returns The generated HTML string.
     */
    public static parse(markdown: string): string {
        if (!markdown) return "";

        // Normalize newlines
        let html = markdown.replace(/\r\n/g, "\n").trim();

        // 0. Pre-process: Code Blocks (```language ... ```)
        // We do this first and replace with placeholders to avoid other rules touching the code content
        const codeBlocks: string[] = [];
        html = html.replace(/^(\s*)```(\w+)?\n([\s\S]*?)\n\s*```/gm, (match, indent, lang, code) => {
            const index = codeBlocks.length;
            const languageClass = lang ? ` class="language-${lang}"` : '';
            
            let lines = code.split('\n');
            
            // Strip the leading indentation of the backticks from all lines if present
            if (indent) {
                lines = lines.map(line => line.startsWith(indent) ? line.substring(indent.length) : line);
            }

            // Find minimum remaining indentation of non-empty lines
            const minIndent = lines.reduce((min, line) => {
                if (line.trim().length === 0) return min;
                const match = line.match(/^(\s*)/);
                const count = match ? match[1].length : 0;
                return Math.min(min, count);
            }, Infinity);

            if (minIndent !== Infinity && minIndent > 0) {
                lines = lines.map(line => line.substring(Math.min(line.length, minIndent)));
            }

            const escapedCode = this.escapeHtml(lines.join('\n').trim());
            codeBlocks.push(`<pre><code${languageClass}>${escapedCode}</code></pre>`);
            return `${indent}:::CB-ID-${index}:::`;
        });

        // 1. Block Elements
        
        // Horizontal Rules
        html = html.replace(/^---$/gm, "<hr />");

        // Headings (# h1, ## h2, etc.)
        html = html.replace(/^###### (.*$)/gm, "<h6>$1</h6>");
        html = html.replace(/^##### (.*$)/gm, "<h5>$1</h5>");
        html = html.replace(/^#### (.*$)/gm, "<h4>$1</h4>");
        html = html.replace(/^### (.*$)/gm, "<h3>$1</h3>");
        html = html.replace(/^## (.*$)/gm, "<h2>$1</h2>");
        html = html.replace(/^# (.*$)/gm, "<h1>$1</h1>");

        // Blockquotes
        html = html.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>");
        html = html.replace(/(<blockquote>.*<\/blockquote>(\n<blockquote>.*<\/blockquote>)*)/g, "<blockquote>\n$1\n</blockquote>");
        // Remove nested blockquotes created by the line-by-line replace
        html = html.replace(/<blockquote>\n<blockquote>(.*)<\/blockquote>\n<\/blockquote>/g, "<blockquote>$1</blockquote>");

        // Unordered Lists (- or *)
        // Capture the start of a list item and any subsequent indented lines
        html = html.replace(/^[\-\*] (.*(?:\n[ \t]+.*)*)/gm, (match, content) => {
            return `<li>${content.trim()}</li>`;
        });
        html = html.replace(/(<li>[\s\S]*?<\/li>(\s*<li>[\s\S]*?<\/li>)*)/g, (match) => {
            if (match.includes('<ul>') || match.includes('<ol>')) return match;
            return `<ul>\n${match}\n</ul>`;
        });

        // Ordered Lists (1. )
        html = html.replace(/^\d+\. (.*(?:\n[ \t]+.*)*)/gm, (match, content) => {
            return `<li>${content.trim()}</li>`;
        });
        // Re-wrapping <li> in <ol> if it wasn't already wrapped in <ul>
        html = html.replace(/(?<!<ul>\n)(<li>[\s\S]*?<\/li>(\s*<li>[\s\S]*?<\/li>)*)/g, (match) => {
            if (match.includes('<ul>') || match.includes('<ol>')) return match;
            return `<ol>\n${match}\n</ol>`;
        });

        // 2. Inline Elements

        // Bold (**text** or __text__)
        html = html.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        html = html.replace(/__(.*?)__/g, "<strong>$1</strong>");

        // Italic (*text* or _text_)
        html = html.replace(/\*(.*?)\*/g, "<em>$1</em>");
        html = html.replace(/_(.*?)_/g, "<em>$1</em>");

        // Links ([text](url))
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');

        // Inline Code (`code`)
        html = html.replace(/`(.*?)`/g, "<code>$1</code>");

        // 3. Paragraphs
        // Split by double newlines and wrap in <p>, excluding already wrapped blocks
        const blocks = html.split(/\n\n+/);
        html = blocks.map(block => {
            block = block.trim();
            if (!block) return "";
            
            // If it's a code block placeholder, return as is
            if (block.startsWith(":::CB-ID-") && block.endsWith(":::")) {
                return block;
            }

            // If it starts with a block-level tag, don't wrap in <p>
            if (/^<(h[1-6]|ul|ol|li|hr|code|pre|blockquote)/i.test(block)) {
                return block;
            }
            return `<p>${block.replace(/\n/g, "<br />")}</p>`;
        }).join("\n");

        // 4. Restore Code Blocks
        codeBlocks.forEach((codeHtml, index) => {
            // Using split/join instead of replace to avoid $ special character issues in replacement string
            html = html.split(`:::CB-ID-${index}:::`).join(codeHtml);
        });

        return html;
    }

    private static escapeHtml(text: string): string {
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

