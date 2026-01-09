# Page snapshot

```yaml
- generic [active]:
  - generic:
    - region "Notifications (F8)":
      - list
    - generic [ref=e2]:
      - heading "Admin Access Required" [level=1] [ref=e3]
      - paragraph [ref=e4]: Please log in to access the admin panel.
      - button "Log In" [ref=e5]
      - link "← Back to Homepage" [ref=e7] [cursor=pointer]:
        - /url: /
  - generic [ref=e8]:
    - generic [ref=e10] [cursor=pointer]:
      - img "Avatar" [ref=e11]
      - generic [ref=e12]: Hi there, have a question? Text us here.
      - button [ref=e13]:
        - img [ref=e14]
    - button "Select to open the chat widget" [ref=e16] [cursor=pointer]:
      - img [ref=e18]
```