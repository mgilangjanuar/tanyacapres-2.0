import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'

export default function Privacy() {
  return <div className="prose container py-6">
    <ReactMarkdown
      children={`## TanyaCapres - Privacy Policy

Effective Date: 2023-12-12

Thank you for using TanyaCapres ("the Service"). This Privacy Policy outlines how we collect, use, disclose, and protect information when you interact with our web application. Please read this policy carefully to understand our practices regarding your data and how we handle it.

**1. Information We Collect:**

- **User-Generated Data:** TanyaCapres does not collect or save any data provided by users during their interactions with the Service.
- **Anonymous User Interaction:** We do not require users to provide personally identifiable information, and all interactions with the Service remain anonymous.

**2. Use of Generative AI:**

- TanyaCapres employs the Anthropic with Claude 2.1 model for its generative AI service. Users acknowledge that AI-generated content is based on algorithms and may not represent real-time or neutral information.

**3. Cookies and Tracking:**

- TanyaCapres does not use cookies or any tracking mechanisms to gather information about users.

**4. Third-Party Links:**

- The Service may contain links to third-party websites. We are not responsible for the privacy practices or content of these external sites. Users are encouraged to review the privacy policies of these third parties.

**5. Security:**

- TanyaCapres employs reasonable security measures to protect against unauthorized access, alteration, disclosure, or destruction of user data. However, we cannot guarantee the security of information transmitted to us over the internet.

**6. Children's Privacy:**

- TanyaCapres is not intended for use by individuals under the age of 13. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with information, please contact us, and we will take appropriate action.

**7. Changes to Privacy Policy:**

- We reserve the right to update this Privacy Policy at any time. Users will be notified of significant changes, and continued use of the Service constitutes acceptance of the updated policy.

**8. Contact Information:**

- For any questions or concerns regarding this Privacy Policy, please contact us at [@mgilangjanuar](https://x.com/mgilangjanuar).

By using TanyaCapres, you agree to the terms outlined in this Privacy Policy.`}
      remarkPlugins={[remarkGfm]}
      components={{
        code({ inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '')
          return !inline ? (
            <SyntaxHighlighter
              children={String(children).replace(/\n$/, '')}
              style={dracula as any}
              language={match?.[1]}
              PreTag="div"
              {...props}
            />
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          )
        }
      }} />
  </div>
}
