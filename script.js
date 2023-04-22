const OFFICER_BTN = "btn-outline-danger";
const OFFICER_BTN_SELECTED = "btn-danger";
const SERGENT_BTN = "btn-outline-info";
const SERGERT_BTN_SELECTED = "btn-info";
const SOILDER_BTN = "btn-outline-secondary";
const SOILDER_BTN_SELECTED = "btn-secondary";
const RANKS = ["#officer-", "#sergeant-", "#soilder-"];
const BTN_CLASS = [OFFICER_BTN, SERGENT_BTN, SOILDER_BTN];
const BTN_SELECTED_CLASS = [OFFICER_BTN_SELECTED, SERGERT_BTN_SELECTED, SOILDER_BTN_SELECTED];


$(function() {
    var member_num = [0, 0, 0];
    var member_rank = {};
    var selected_members = new Set();

    if (localStorage.length > 0) {
        for (var key in localStorage) {
            var item = localStorage.getItem(key);
            if (!item) continue;
            var member = JSON.parse(item);
            add_member(member.name, member.rank, key);
            if (member.selected) {
                select_member($(`#${key}`));
            }
        }
    }


    function add_member(name, rank, hash="") {
        if (hash == "") {
            hash = MD5.generate(name);
        }
        var box = $("<div></div>").attr({
            class: "col-auto",
            id: `div-${hash}`,
        });
        var member = $(`<button>${name}</button>`).attr({
            type: "button",
            class: `btn ${BTN_CLASS[rank]}`,
            id: hash,
            "data-bs-toggle": "button",
        });
        member.click(select_member_event);

        box.append(member);
        $(`${RANKS[rank]}list`).append(box);
        // $(RANKS[rank]+"label").removeClass("hidden");

        member_rank[hash] = rank;
        return hash;
    }

    function select_member_event() {
        select_member($(this));
        var id = $(this).attr("id");
        var data = JSON.parse(localStorage.getItem(id));
        data["selected"] = true;
        localStorage.setItem(id, JSON.stringify(data));
    }

    function select_member(member) {
        var rank = member_rank[member.attr("id")];
        // $(this).removeClass(BTN_CLASS[rank]).addClass(BTN_SELECTED_CLASS[rank]);
        member.addClass("active");
        member.off("click", select_member_event);
        member.click(deselect_member_event);

        member_num[rank]++;
        selected_members.add(member.attr("id"));
        update_ui(rank);
    }

    
    function deselect_member_event() {
        deselect_member($(this));
        var id = $(this).attr("id");
        var data = JSON.parse(localStorage.getItem(id));
        data["selected"] = false;
        localStorage.setItem(id, JSON.stringify(data));
    }

    function deselect_member(member) {
        var rank = member_rank[member.attr("id")];
        // $(this).removeClass(BTN_SELECTED_CLASS[rank]).addClass(BTN_CLASS[rank]);
        member.removeClass("active");
        member.off("click", deselect_member_event);
        member.click(select_member_event);

        member_num[rank]--;
        selected_members.delete(member.attr("id"));
        update_ui(rank);
    }


    function update_ui(rank=-1) {
        if (rank < 0) {
            for (var i = 0; i < member_num.length; i++) {
                $(`${RANKS[i]}num`).text(member_num[i]);
            }
        } else {
            $(`${RANKS[rank]}num`).text(member_num[rank]);
        }
        $("#total-num").text(selected_members.size);
    }


    function delete_members() {
        selected_members.forEach(member => {
            $(`#div-${member}`).remove();
            delete member_rank[member];
            localStorage.removeItem(member);
        });
        selected_members.clear();
        for (var i = 0; i < member_num.length; i++) {
            member_num[i] = 0;
        }
        update_ui();
    }

    $("#add-btn").click(function() {
        var name = $("#input-name").val();
        if (!name) {
            alert("請輸入人名");
            return;
        }
        var id = MD5.generate(name);
        if (id in member_rank) {
            alert("人名重複了");
            return;
        }
        var rank = $("#input-class option:selected").val();
        if (rank < 0) {
            alert("請選擇階級");
            return;
        }
        add_member(name, rank, id);        
        localStorage.setItem(id, JSON.stringify({
            "name": name,
            "rank": rank,
            "selected": false
        }));
        $("#input-name").val('');
    });

    $("#delete-btn").click(delete_members);

    $("#delete-all-btn").click(function() {
        delete_members();
        for (const member in member_rank) {
            $(`#div-${member}`).remove();
            delete member_rank[member];
        }
        localStorage.clear();
    })
});