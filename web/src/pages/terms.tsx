import { ReactMarkdown } from 'react-markdown/lib/react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { dracula } from 'react-syntax-highlighter/dist/cjs/styles/prism'
import remarkGfm from 'remark-gfm'

export default function Terms() {
  return <div className="prose container py-6">
    <ReactMarkdown
      children={`## TanyaCapres - Terms of Service

**1. Acceptance of Terms**

By accessing or using the TanyaCapres web application ("the Service"), you agree to comply with and be bound by these Terms of Service. If you do not agree to these terms, please refrain from using the Service.

**2. Use of Generative AI**

TanyaCapres utilizes the Anthropic with Claude 2.1 model for its generative AI service. Users acknowledge that the AI-generated content is based on algorithms and may not represent real-time or neutral information. The developers make continuous efforts to enhance the accuracy and fairness of the AI, but users should interpret the results with discretion.

**3. Data Collection and Privacy**

TanyaCapres does not collect or save any user data. We prioritize user privacy, and your interactions with the Service are anonymous. No personally identifiable information is stored during your use of the features.

**4. Free Access for Anonymous Users**

All features of TanyaCapres are provided 100% free of charge for anonymous users. There are no hidden fees or subscription charges associated with accessing and using the Service.

**5. User Conduct**

Users are expected to use the Service responsibly and abide by applicable laws and regulations. Any misuse, abuse, or violation of these terms may result in the termination of access to the Service.

**6. Disclaimer of Warranties**

TanyaCapres is provided "as is," without any warranties, express or implied. The developers do not guarantee the accuracy, completeness, or reliability of the information generated by the AI.

**7. Limitation of Liability**

In no event shall the developers of TanyaCapres be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly.

**8. Changes to Terms**

The developers reserve the right to modify or revise these Terms of Service at any time. Users will be notified of significant changes, and continued use of the Service constitutes acceptance of the updated terms.

**9. Governing Law**

These Terms of Service shall be governed by and construed in accordance with the laws of Indonesia, without regard to its conflict of law principles.

**10. Contact Information**

For any inquiries or concerns regarding these Terms of Service, please contact us at [@mgilangjanuar](https://x.com/mgilangjanuar).

By using TanyaCapres, you agree to these Terms of Service.`}
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