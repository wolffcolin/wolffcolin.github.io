# Decision log

Your methods section. About one page total.

Answer these as you go, not the night before it is due.
Specifics beat polish - a short honest answer is worth more than a long vague one.

Delete these instructions when you are done, or leave them. It does not matter.

---

## 1. What did you set out to build, and what changed?

What you wanted at the start, and what is actually live now.
Name one thing you dropped or added along the way, and why.

I knew from the start I wanted to build a portfolio site I could direct prospective employers to that had some resume information and information on my projects. I also knew I liked wireframe type designs for web pages, and I wanted something with hard outlines for each section, that looked similar to a terminal or command line interface type of UI. I realized fairly early on that it would be boring to just make a webpage that serves my resume in a nice format, so I wanted to add more. I like climbing and hiking, and have GPS tracks from some of my adventures, and I thought it would be cool to integrate this somehow. I decided a map with dots for the peaks I've summited would be good, with a pop out topographical map that showed my exact GPS track. I think this addition adds more personality to the site, and gives it an interactive aspect that makes it more interesting and engaging. 

---

## 2. A fork in the road

Name one real choice where you could have gone two ways.
Plain HTML or a framework. One page or several. Your own CSS or someone's template.
What goes on the front page and what does not.

Say which you picked, what the alternative was, and what you gave up by not taking it.

"There was no alternative" is not an answer. Find the fork.

After finishing the basic outline of my inital design, the wireframe, terminal-style site, I had a totally different idea that went in the opposite direction. I had been playing a game called Straftat, which has a really unique and almost intentionally bad, early 2000s style menu screens. I thought it was funny, and would be an interesting exercise in trying to create a UI with agentic coding that doesn't really lend itself to typical frontend frameworks. The alternative in this case was to stick with the wireframe UI, and make it clean and snappy, rather than adding a sense of humor to the site. I spent several hours tweaking the new design, but it really continued to look like a web page, with clear structure and layout, rather than the ridiculous layout I was going for. I decided to stick with the initial wireframe design because I want to use this site as my actual portfolio site, and if I couldn't get the full effect of this funnily bad UI layout, it would be better to go with something more professional. I did, however, really like how the peaks map turned out on the alternative design, it has a sort of green-lcd screen look to it.

---

## 3. Where you overruled the agent

One time Claude suggested, wrote, or claimed something and you did not take it.

What did it do? How did you notice? What did you do instead?

If it genuinely never happened, say so plainly, and then say what you would have had to
check in order to notice. Being honest here costs you far less than a story you cannot
defend when you record your video.

Initially I had a vision for the style of site I wanted to build, which was simple, framed out with box outlines for each section, and a vague, terminal-like style. I never encountered severe resistance from Claude, but there were smaller examples of it doing something I did not like, which I had to right. For example, the inital box outlines were almost picture frame style, with thicker edges around the corner to imply some bracing, which did not reflect the terminal-style I was going for, in my opinion. I noticed this by carefully examining the UI it created. I corrected this by carefully explaining both the exact issue I had, what I was actually going for, and the terminal-style motivation for why I wanted this change. It was a one-shot fix, the next iteration of the site was much closer to what I was going for, at least in this respect. 

---

## 4. How you know it works

What check did you run, and what did it tell you?

Then the real question: **what would have made this check fail?**
A check that could not have failed is not a check.

Link to your `verification/` folder.

Link: [verification/](./verification/)

I opened the link in my web browser, ensuring I used fresh instance of the browser and a new window. I ensured the site loaded, it looked correct and well formatted, as I intended, and that all aspects, especially the peak map, worked well. I used the curl command to fetch my website as well, and ensured the html that was fetched was correct. Finally, I also loaded the web page on my phone to ensure a different screen size didn't break formatting, and that the peak explorer was still functional and navigable even on touch screen.
This check could have failed at multiple points. The page could have not loaded, due to some misconfiguration of the repo or the site. The page could have loaded, but the formatting was off, and buttons don't work. Additionally, the peak map could have been malformed, or hard to navigate, espeically on the phone screen. If it was not usable (and clean looking), this would be a fail. 

---

## 5. What is still wrong

One thing on your own site that is not right, not finished, or that you do not
fully understand.

What would you do next, and how would you find out?

For one, I think a portfolio site is not complete without some kind of demo, or at least a link to a repo. This is more of a data problem for me, as my biggest projects don't have repos I can access (someone else owns them), and its not clear whether I'm allowed to link to this, or if these repos would be visible. I think I should extend the site to support some kind of live demo or repo linking, so that future personal projects where I have clean access to the code can be showcased in some way.
Another thing I'd like to consider is merging a bit of the two site styles I created. I really liked the green, almost CRT-screen look of the alternative design's map. I would like to integrate a slightly more styled map for the peaks section that looks similar to that style of CRT screen. 
