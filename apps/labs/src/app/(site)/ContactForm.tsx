"use client";

//Not needed

import { useState, type FormEvent } from "react";
import { ChevronDown } from "lucide-react";
import { Button } from "@lmlabs/ui";
import styles from "./ContactForm.module.css";

const SUBJECTS = ["General inquiry", "Partnership", "Press", "Support", "Other"];

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className={styles.card}>
      <h2 className={styles.title}>Get in Touch</h2>
      <p className={styles.subtitle}>
        We&apos;d love to hear from you. Fill out the form and we&apos;ll get back to you as soon as possible.
      </p>

      {submitted ? (
        <p className={styles.success}>Thanks for reaching out — we&apos;ll get back to you soon.</p>
      ) : (
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="contact-name">
                Full Name <span className={styles.required}>*</span>
              </label>
              <input id="contact-name" name="name" type="text" placeholder="John Doe" required className={styles.input} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="contact-company">
                Company
              </label>
              <input id="contact-company" name="company" type="text" placeholder="Your Company" className={styles.input} />
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="contact-email">
                Email Address <span className={styles.required}>*</span>
              </label>
              <input id="contact-email" name="email" type="email" placeholder="john@example.com" required className={styles.input} />
            </div>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="contact-phone">
                Phone Number
              </label>
              <input id="contact-phone" name="phone" type="tel" placeholder="+971 50 123 4567" className={styles.input} />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="contact-subject">
              Subject <span className={styles.required}>*</span>
            </label>
            <div className={styles.selectWrap}>
              <select id="contact-subject" name="subject" required defaultValue="" className={styles.select}>
                <option value="" disabled>
                  Select a subject
                </option>
                {SUBJECTS.map((subject) => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
              <ChevronDown className={styles.selectIcon} aria-hidden />
            </div>
          </div>

          <div className={styles.field}>
            <label className={styles.label} htmlFor="contact-message">
              How can we help you? <span className={styles.required}>*</span>
            </label>
            <textarea
              id="contact-message"
              name="message"
              placeholder="Tell us how we can help you..."
              required
              rows={6}
              className={styles.textarea}
            />
          </div>

          <Button type="submit" variant="filled" className={styles.submit}>
            Send Message
          </Button>
        </form>
      )}
    </div>
  );
}
